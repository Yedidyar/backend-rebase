import Fastify from "fastify";
import blobPlugin from "./blob/index.js";
import { mkdirSync } from "node:fs";
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
    mkdirSync(config.BLOBS_DIR, { recursive: true });
    mkdirSync(config.METADATA_DIR, { recursive: true });

    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
