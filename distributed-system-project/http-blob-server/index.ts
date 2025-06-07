import Fastify from "fastify";
import blobPlugin from "./blob/index.ts";
import { mkdirSync } from "node:fs";
import { config } from "./config.ts";
import { logger } from "./logger/index.ts";

const fastify = Fastify();

fastify.register(blobPlugin, { prefix: "/blobs" });

/**
 * Run the server!
 */

const PORT = 3001;
const start = async () => {
  try {
    mkdirSync(config.BLOBS_DIR, { recursive: true });
    mkdirSync(config.METADATA_DIR, { recursive: true });

    await fastify.listen({ port: PORT });
    const address = fastify.server.address();
    await fetch(`http://${config.LOAD_BALANCER_ADDRESS}/internal/nodes`, {
      method: "POST",
      body: JSON.stringify({
        node_name: config.NODE_NAME,
        node_address: `http://${address}`,
      }),
    });
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
