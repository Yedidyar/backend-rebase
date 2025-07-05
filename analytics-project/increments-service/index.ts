import Fastify from "fastify";
import { config } from "../config.ts";
import { createLogger } from "../logger/index.ts";
import { IncrementsRepository } from "./repositories/increments.ts";
import { incrementsRoutes } from "../increments-service/handlers/index.ts";
import { IncrementsService } from "./services/increments.service.ts";

export const logger = createLogger("increments-service");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    incrementsRepository: IncrementsRepository;
    incrementsService: IncrementsService;
  }
}

const start = async () => {
  try {
    fastify.decorate("incrementsRepository", new IncrementsRepository());
    fastify.decorate(
      "incrementsService",
      new IncrementsService(fastify.incrementsRepository),
    );

    await fastify.register(incrementsRoutes, { prefix: "/increments" });

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
