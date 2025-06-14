import Fastify from "fastify";
import { blobCachedRoutes } from "./cache/routes.ts";

const fastify = Fastify();

fastify.addContentTypeParser(
  "*",
  { parseAs: "buffer", bodyLimit: Infinity },
  (req, body, done) => {
    done(null, body);
  },
);

fastify.register(blobCachedRoutes, { prefix: "/blobs" });

const start = async () => {
  try {
    await fastify.listen({ port: 4242, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
