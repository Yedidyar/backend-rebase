import Fastify from "fastify";
import blobPlugin from "./blob/index.js";
import { mkdirSync } from "node:fs";
import { config } from "./config.js";
import { logger } from "./logger/index.js";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const fastify = Fastify();

fastify.register(blobPlugin, { prefix: "/blobs" });

/**
 * Run the server!
 */

const PORT = 3000;
const start = async () => {
  try {
    mkdirSync(config.BLOBS_DIR, { recursive: true });
    mkdirSync(config.METADATA_DIR, { recursive: true });

    await fastify.listen({ port: PORT });
    const address = fastify.server.address();
    logger.info({
      message: `server is up and running`,
      address,
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
