import Fastify, { type FastifyRequest } from "fastify";
import axios from "axios";
import { toTitleCase } from "../string-utils/to-title-case.ts";
import registerPlugin, { NodeRegistrationService } from "./register/index.ts";
import { config } from "./config.ts";

function getHeaders(request: FastifyRequest) {
  // Create a plain object for headers instead of Headers object
  const headers: Record<string, string | string[]> = {};

  // Process each header properly
  Object.entries(request.headers).forEach(([key, value]) => {
    // Skip undefined values
    if (value === undefined) return;

    // Use the original value without toString() to preserve arrays
    headers[toTitleCase(key)] = value;
  });

  // Set host header
  headers["Host"] = request.host;

  return headers;
}

export class Readiness {
  private isReady = false;

  getIsReady(): boolean {
    return this.isReady;
  }

  markAsReady() {
    this.isReady = true;
  }
}

export const readiness = new Readiness();

const fastify = Fastify();

fastify.addContentTypeParser(
  "*",
  { parseAs: "buffer", bodyLimit: Infinity },
  (req, body, done) => {
    done(null, body);
  },
);

fastify.register(registerPlugin, { prefix: "/internal" });

fastify.all<{ Params: { id: string } }>(
  "/blobs/:id",
  async (request, replay) => {
    if (!readiness.getIsReady()) {
      return replay.status(503).send({ error: "Service not ready" });
    }

    try {
      const node = NodeRegistrationService.getDownstreamNode(request.params.id);

      await axios.request({
        baseURL: `http://${node.destination.host}:${node.destination.port}/blobs/${request.params.id}`,
        headers: getHeaders(request),
        method: request.method,
        data: request.body,
      });

      return replay.status(200).send();
    } catch (e) {
      console.log(e);

      replay.status(503).send();
    }
  },
);

const start = async () => {
  try {
    setTimeout(() => {
      readiness.markAsReady();
    }, 1000 * config.REGISTRATION_DURATION_SECONDS);
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    const address = fastify.server.address();
    console.log(address);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
