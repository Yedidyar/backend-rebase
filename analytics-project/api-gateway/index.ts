import Fastify, { type FastifyRequest } from "fastify";
import { createLogger } from "../logger/index.ts";
import { config } from "./config.ts";
import { PartitionerService } from "./services/partitioner.service.ts";
import { routes } from "./handlers/index.ts";

export const logger = createLogger("api-gateway");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    partitionerService: PartitionerService;
  }
}

const start = async () => {
  try {
    const partitionerService = new PartitionerService();
    fastify.decorate("partitionerService", partitionerService);

    await partitionerService.start();

    await fastify.register(routes, { prefix: "/" });

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });

    logger.info(
      `API Gateway service started on port ${config.PORT}. Connected to RabbitMQ.`,
    );
    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      await partitionerService.stop();
      await fastify.close();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      await partitionerService.stop();
      await fastify.close();
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
