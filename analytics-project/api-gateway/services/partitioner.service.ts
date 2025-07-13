import amqp from "amqplib";
import type { Channel } from "amqplib";
import { createHash } from "node:crypto";
import { config } from "../config.ts";
import { logger } from "../index.ts";

export class PartitionerService {
  private readonly EXCHANGE_NAME = "analytics_exchange";
  private channel?: Channel;

  public async start(): Promise<void> {
    logger.info(`Connecting to RabbitMQ at ${config.RABBITMQ_URL}`);

    const connection = await amqp.connect(config.RABBITMQ_URL);
    this.channel = await connection.createChannel();

    await this.channel.assertExchange(this.EXCHANGE_NAME, "direct", {
      durable: true,
    });

    for (let i = 0; i < config.NUM_PARTITIONS; i++) {
      const queueName = `${config.OUTPUT_QUEUE_PREFIX}${i}`;
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, this.EXCHANGE_NAME, queueName);
    }

    logger.info(
      `PartitionerService connected to RabbitMQ. Exchange: ${this.EXCHANGE_NAME}, Partitions: ${config.NUM_PARTITIONS}`,
    );
  }

  public async stop(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    logger.info("PartitionerService stopped gracefully");
  }

  public async publishWithKey(
    content: object,
    partitionKey: string,
  ): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      throw new Error("PartitionerService not started. Call start() first.");
    }

    try {
      const hash = createHash("md5").update(partitionKey).digest("hex");
      const partition = parseInt(hash, 16) % config.NUM_PARTITIONS;
      const routingKey = `${config.OUTPUT_QUEUE_PREFIX}${partition}`;

      channel.publish(
        this.EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(content)),
        {
          persistent: true,
          headers: {
            partitionKey: partitionKey,
            targetPartition: partition,
          },
        },
      );

      logger.info(
        `Published message to fanout exchange: ${this.EXCHANGE_NAME} with routing key: ${routingKey} using partition key: ${partitionKey}`,
      );
    } catch (error) {
      logger.error("Error publishing message with key", error);
      throw error;
    }
  }
}
