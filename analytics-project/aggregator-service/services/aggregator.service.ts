import amqp from "amqplib";
import type { Channel, Connection, Message } from "amqplib";
import { config } from "../../config.ts";
import { logger } from "../index.ts";

// New input schema type
export type PageViewBatch = {
  [pageName: string]: {
    [timestamp: string]: number;
  };
};

export interface AggregatedPageViews {
  page: string;
  count: number;
  timestamp: string; // aggregation time
}

async function getRabbitConnection() {
  const connection = await amqp.connect(config.RABBITMQ_URL);
  return {
    connection,
    [Symbol.asyncDispose]: async () => {
      await connection.close();
    },
  };
}

export class AggregatorService {
  private channel?: Channel;
  private isRunning = false;
  private batchTimeout?: NodeJS.Timeout;
  private currentBatch: PageViewBatch[] = [];

  async start(): Promise<void> {
    try {
      logger.info(`Connecting to RabbitMQ at ${config.RABBITMQ_URL}`);
      await using connObj = await getRabbitConnection();
      this.channel = await connObj.connection.createChannel();

      // Ensure queue exists
      await this.channel.assertQueue(config.INPUT_QUEUE, {
        durable: true,
      });

      logger.info(
        `Connected to RabbitMQ and listening to queue: ${config.INPUT_QUEUE}`,
      );

      this.isRunning = true;
      await this.startConsuming();
    } catch (error) {
      logger.error("Failed to start aggregator service", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    if (this.currentBatch.length > 0) {
      await this.processBatch();
    }

    if (this.channel) {
      await this.channel.close();
    }

    logger.info("Aggregator service stopped");
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.consume(
      config.INPUT_QUEUE,
      async (message: Message | null) => {
        if (!message) return;

        try {
          await this.handleMessage(message);
        } catch (error) {
          logger.error("Error handling message", error);
          // Reject the message to requeue it
          this.channel?.nack(message, false, true);
        }
      },
      {
        noAck: false,
      },
    );

    logger.info("Started consuming messages from queue");
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      const content = JSON.parse(message.content.toString()) as PageViewBatch;

      // Validate message
      if (!content || typeof content !== "object") {
        logger.warn("Invalid message format", content);
        this.channel?.ack(message);
        return;
      }

      this.currentBatch.push(content);
      this.channel?.ack(message);

      // Check if we should process the batch
      if (this.currentBatch.length >= config.BATCH_SIZE) {
        await this.processBatch();
      } else if (this.currentBatch.length === 1) {
        // Start timeout for first message in batch
        this.startBatchTimeout();
      }
    } catch (error) {
      logger.error("Error parsing message", error);
      this.channel?.ack(message); // Acknowledge to avoid infinite loop
    }
  }

  private startBatchTimeout(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(async () => {
      if (this.currentBatch.length > 0) {
        await this.processBatch();
      }
    }, config.BATCH_TIMEOUT_MS);
  }

  private async processBatch(): Promise<void> {
    if (this.currentBatch.length === 0) return;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    const batch = [...this.currentBatch];
    this.currentBatch = [];

    try {
      const aggregatedData = this.aggregatePageViewBatches(batch);

      if (aggregatedData.length > 0) {
        await this.sendToIncrementsService(aggregatedData);
        logger.info(
          `Processed batch of ${batch.length} messages, aggregated into ${aggregatedData.length} page views`,
        );
      }
    } catch (error) {
      logger.error("Error processing batch", error);
      // In a production system, you might want to implement retry logic or dead letter queues
    }
  }

  // Aggregate the new schema: sum counts per page across all timestamps and batches
  public aggregatePageViewBatches(
    batches: PageViewBatch[],
  ): AggregatedPageViews[] {
    const pageCounts = new Map<string, number>();
    let latestTimestamp = new Date(0);

    for (const batch of batches) {
      for (const [page, timestamps] of Object.entries(batch)) {
        for (const [timestamp, count] of Object.entries(timestamps)) {
          // Sum counts per page
          pageCounts.set(page, (pageCounts.get(page) || 0) + count);
          // Track the latest timestamp for reporting
          const tsDate = new Date(timestamp);
          if (!isNaN(tsDate.getTime()) && tsDate > latestTimestamp) {
            latestTimestamp = tsDate;
          }
        }
      }
    }

    const aggregationTime = (
      latestTimestamp.getTime() > 0 ? latestTimestamp : new Date()
    ).toISOString();
    const aggregated: AggregatedPageViews[] = [];
    for (const [page, count] of pageCounts) {
      aggregated.push({
        page,
        count,
        timestamp: aggregationTime,
      });
    }
    return aggregated;
  }

  private async sendToIncrementsService(
    aggregatedData: AggregatedPageViews[],
  ): Promise<void> {
    try {
      const response = await fetch(
        `${config.INCREMENTS_SERVICE_URL}/page-views/multi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aggregatedData),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info(
        `Successfully sent ${aggregatedData.length} aggregated page views to increments service`,
      );
    } catch (error) {
      logger.error("Failed to send data to increments service", error);
      throw error;
    }
  }
}
