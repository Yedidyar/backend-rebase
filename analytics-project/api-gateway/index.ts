import Fastify from "fastify";
import { createLogger } from "../logger/index.ts";
import { config } from "./config.ts";
import { PartitionerService } from "./services/partitioner.service.ts";

export const logger = createLogger("api-gateway");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    partitionerService: PartitionerService;
  }
}

const start = async () => {
  try {
    fastify.decorate("partitionerService", new PartitionerService());

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });

    logger.info(
      `API Gateway service started. Listening to queue: ${config.INPUT_QUEUE}`,
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
