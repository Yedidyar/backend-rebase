import Fastify from "fastify";
import { createHash } from "node:crypto";
import axios from "axios";
import { toTitleCase } from "../string-utils/to-title-case.ts";
import registerPlugin, {
  NodeRegistrationService,
  type RegisteredNode,
} from "./register/index.ts";

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

      const res = await axios.request({
        baseURL: `http://${node.destination.host}:${node.destination.port}/blobs/${request.params.id}`,
        headers: headers as any,
        method: request.method,
        data: request.body,
      });

      return res;
    } catch (e) {
      console.log(e);

      replay.status(503).send();
    }
  }
);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    const address = fastify.server.address();
    console.log(address);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
