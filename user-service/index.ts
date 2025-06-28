import Fastify from "fastify";
import { config } from "./config.ts";
import { createLogger } from "./logger/index.ts";

export const logger = createLogger("user-service");


const fastify = Fastify();

/**
 * Run the server!
 */

const start = async () => {
  try {


    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
