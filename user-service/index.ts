import Fastify from "fastify";
import { config } from "./config.ts";
import { createLogger } from "./logger/index.ts";
import pg from "pg"

export const logger = createLogger("user-service");

const fastify = Fastify();

/**
 * Run the server!
 */

const start = async () => {
  try {
    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
