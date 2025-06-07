import Fastify from "fastify";
import blobPlugin from "./blob/index.ts";
import { mkdirSync } from "node:fs";
import { config } from "./config.ts";
import { logger } from "./../logger/index.ts";
import type { AddressInfo } from "node:net";

const fastify = Fastify();

fastify.register(blobPlugin, { prefix: "/blobs" });

/**
 * Run the server!
 */

const start = async () => {
  try {
    mkdirSync(config.BLOBS_DIR, { recursive: true });
    mkdirSync(config.METADATA_DIR, { recursive: true });

    await fastify.listen({ port: config.PORT, host: "127.0.0.1" });
    const address = fastify.server.address() as AddressInfo;

    const res = await fetch(
      `http://${config.LOAD_BALANCER_ADDRESS}/internal/nodes`,
      {
        method: "POST",
        body: JSON.stringify({
          destination: {
            host: address.address,
            port: address.port,
          },
          name: config.NODE_NAME,
        }),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to register with load balancer: ${res.status} ${errorText}`,
      );
    }

    logger.info({
      message: `server is up and running`,
      address,
      registrationStatus: res.status,
      registrationStatusText: res.statusText,
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
