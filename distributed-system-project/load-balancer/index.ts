import Fastify, { type FastifyRequest } from "fastify";
import axios, { AxiosError } from "axios";
import { toTitleCase } from "../string-utils/to-title-case.ts";
import registerPlugin, { NodeRegistrationService } from "./register/index.ts";
import { config } from "./config.ts";
import { createLogger } from "../logger/index.ts";

export const logger = createLogger("load-balancer");

function getHeaders(request: FastifyRequest) {
  const headers: Record<string, string | string[]> = {};

  Object.entries(request.headers).forEach(([key, value]) => {
    if (value === undefined) return;

    headers[toTitleCase(key)] = value;
  });

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
  async (request, reply) => {
    if (!readiness.getIsReady()) {
      return reply.status(503).send({ error: "Service not ready" });
    }

    try {
      const node = NodeRegistrationService.getDownstreamNode(request.params.id);

      const response = await axios.request({
        baseURL: `http://${node.destination.host}:${node.destination.port}/blobs/${request.params.id}`,
        headers: getHeaders(request),
        method: request.method,
        data: request.body,
      });

      return reply.status(response.status).send();
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;

        if (status === 404) {
          return reply.status(404).send({ error: "Resource not found" });
        }

        logger.error({
          blobId: request.params.id,
          msg: "Bad response from downstream service",
          action: "GET blob",
          cause: axiosError.cause,
        });

        return reply.status(status).send({
          error: "downstream error",
          status,
          message: axiosError.response.data ?? axiosError.message,
        });
      }

      if (axiosError.request) {
        logger.error({
          blobId: request.params.id,
          msg: "No response from downstream service",
          action: "GET blob",
          cause: axiosError.cause,
        });
        return reply
          .status(502)
          .send({ error: "No response from downstream service" });
      }
      logger.error({
        blobId: request.params.id,
        msg: "Internal server error",
        action: "GET blob",
        cause: axiosError.cause,
      });
      return reply
        .status(500)
        .send({ error: "Internal server error", message: axiosError.message });
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
