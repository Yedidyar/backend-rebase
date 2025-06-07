import Fastify from "fastify";
import axios from "axios";
import { toTitleCase } from "../string-utils/to-title-case.ts";
import registerPlugin, { NodeRegistrationService } from "./register/index.ts";
import { config } from "./config.ts";

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
  }
);

fastify.register(registerPlugin, { prefix: "/internal" });

fastify.all<{ Params: { id: string } }>(
  "/blobs/:id",
  async (request, replay) => {
    if (!readiness.getIsReady()) {
      return replay.status(503).send({ error: "Service not ready" });
    }

    try {
      const headerEntries = Object.entries(request.headers).map(
        ([key, value]) =>
          [toTitleCase(key), value?.toString() || ""] as [string, string]
      );
      const headers = new Headers(headerEntries);
      headers.set("Host", request.host);

      const node = NodeRegistrationService.getDownstreamNode(
        `${Math.random()}`
        // request.ip,
      );

      await axios.request({
        baseURL: `http://${node.destination.host}:${node.destination.port}/blobs/${request.params.id}`,
        headers: headers as any,
        method: request.method,
        data: request.body,
      });

      return replay.status(200).send();
    } catch (e) {
      console.log(e);

      replay.status(503).send();
    }
  }
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
