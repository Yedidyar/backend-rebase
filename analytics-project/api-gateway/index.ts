import { createLogger } from "../logger/index.ts";
import { config } from "./config.ts";
import { PartitionerService } from "./services/partitioner.service.ts";

export const logger = createLogger("api-gateway");

const start = async () => {
  try {
    const partitionerService = new PartitionerService();
    await partitionerService.start();
    logger.info(
      `API Gateway service started. Listening to queue: ${config.INPUT_QUEUE}`,
    );
    logger.info(
      `Forwarding to ${config.NUM_PARTITIONS} queues with prefix: ${config.OUTPUT_QUEUE_PREFIX}`,
    );

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      await partitionerService.stop();
      process.exit(0);
    });
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      await partitionerService.stop();
      process.exit(0);
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
