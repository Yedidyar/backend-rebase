import Fastify from "fastify";
import blobPlugin from "./blob/index.ts";
import { mkdirSync } from "node:fs";
import { config } from "./config.ts";
import type { AddressInfo } from "node:net";
import { createLogger } from "../logger/index.ts";

export const logger = createLogger("http-blob-server");

const fastify = Fastify();

fastify.register(blobPlugin, { prefix: "/blobs" });

const handleRegistrationError = async (res: Response) => {
  const errorText = await res.text();
  throw new Error(
    `Failed to register with load balancer: ${res.status} ${errorText}`,
  );
};

/**
 * Run the server!
 */

const start = async () => {
  try {
    mkdirSync(config.BLOBS_DIR, { recursive: true });
    mkdirSync(config.METADATA_DIR, { recursive: true });

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
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
      await handleRegistrationError(res);
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
