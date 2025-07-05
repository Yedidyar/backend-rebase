import Fastify from "fastify";
import { config } from "../config.ts";
import { createLogger } from "../logger/index.ts";
import { PageViewsReportRepository } from "./repositories/page-views.ts";
import { pageViewsRoutes } from "./handlers/index.ts";

export const logger = createLogger("user-service");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    pageViewsRepository: PageViewsReportRepository;
  }
}

const start = async () => {
  try {
    fastify.decorate("pageViewsRepository", new PageViewsReportRepository());

    await fastify.register(pageViewsRoutes, { prefix: "/report" });

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

// Only start the server if this file is run directly (not imported as a module)
// This prevents the server from starting when the file is imported for testing or other purposes
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
