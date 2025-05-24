import Fastify from "fastify";
import blobPlugin from "./blob/controller.js";
import { existsSync, mkdirSync } from "node:fs";
import { config } from "./config.js";

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

const fastify = Fastify({
  logger: envToLogger["development"],
});

fastify.register(blobPlugin, { prefix: "/blobs" });

/**
 * Run the server!
 */
const start = async () => {
  try {
    if (!existsSync(config.BLOBS_DIR)) {
      mkdirSync(config.BLOBS_DIR);
    }
    if (!existsSync(config.METADATA_DIR)) {
      mkdirSync(config.METADATA_DIR);
    }

    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
