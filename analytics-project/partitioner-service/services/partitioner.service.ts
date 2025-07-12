import amqp from "amqplib";
import { createHash } from "node:crypto";
import { config } from "../partitioner-config.ts";
import { createLogger } from "../../logger/index.ts";

const logger = createLogger("partitioner-service");

async function getRabbitConnection() {
  const connection = await amqp.connect(config.RABBITMQ_URL);
  return {
    connection,
    [Symbol.asyncDispose]: async () => {
      await connection.close();
    },
  };
}

export class PartitionerService {
  private channel?: amqp.Channel;
  private isRunning = false;

  async start(): Promise<void> {
    try {
      logger.info(`Connecting to RabbitMQ at ${config.RABBITMQ_URL}`);
      await using connObj = await getRabbitConnection();
      this.channel = await connObj.connection.createChannel();

      // Ensure input queue exists
      await this.channel.assertQueue(config.INPUT_QUEUE, { durable: true });
      // Ensure output queues exist
      for (let i = 0; i < config.NUM_PARTITIONS; i++) {
        await this.channel.assertQueue(`${config.OUTPUT_QUEUE_PREFIX}${i}`, {
          durable: true,
        });
      }

      logger.info(
        `Connected to RabbitMQ and listening to queue: ${config.INPUT_QUEUE}`,
      );
      this.isRunning = true;
      await this.startConsuming();
    } catch (error) {
      logger.error("Failed to start partitioner service", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.channel) {
      await this.channel.close();
    }
    logger.info("Partitioner service stopped");
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error("Channel not initialized");
    await this.channel.consume(
      config.INPUT_QUEUE,
      async (message) => {
        if (!message) return;
        try {
          await this.handleMessage(message);
        } catch (error) {
          logger.error("Error handling message", error);
          this.channel?.nack(message, false, true);
        }
      },
      { noAck: false },
    );
    logger.info("Started consuming messages from input queue");
  }

  public async handleMessage(message: amqp.Message): Promise<void> {
    try {
      const content = message.content.toString();
      // Use a hash of the content to determine the partition
      const hash = createHash("md5").update(content).digest("hex");
      const partition = parseInt(hash, 16) % config.NUM_PARTITIONS;
      const outputQueue = `${config.OUTPUT_QUEUE_PREFIX}${partition}`;
      await this.channel!.sendToQueue(outputQueue, Buffer.from(content), {
        persistent: true,
      });
      logger.info(`Partitioned message to queue: ${outputQueue}`);
      this.channel!.ack(message);
    } catch (error) {
      logger.error("Error partitioning message", error);
      this.channel!.ack(message); // Acknowledge to avoid infinite loop
    }
  }
}
