import Fastify from "fastify";
import { config } from "../config.ts";
import { createLogger } from "../logger/index.ts";
import { AggregatorService } from "./services/aggregator.service.ts";

export const logger = createLogger("aggregator-service");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    aggregatorService: AggregatorService;
  }
}

/**
 * Run the aggregator service!
 */

const start = async () => {
  try {
    const aggregatorService = new AggregatorService();
    fastify.decorate("aggregatorService", aggregatorService);

    // Start the aggregator service
    await aggregatorService.start();

    logger.info(`Aggregator service started with ID: ${config.AGGREGATOR_ID}`);
    logger.info(`Listening to queue: ${config.INPUT_QUEUE}`);
    logger.info(
      `Batch size: ${config.BATCH_SIZE}, Timeout: ${config.BATCH_TIMEOUT_MS}ms`,
    );

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      await aggregatorService.stop();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      await aggregatorService.stop();
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
