import Fastify from "fastify";

const ALLOWED_APIS = {
  POST: ["/blobs/*"],
  GET: ["/blobs/*"],
  DELETE: ["/blobs/*"],
} as const;

const fastify = Fastify();

fastify.all("*", async (request, replay) => {
  if (request.url) {
    // TODO: filter logic
  }
  try {
    const headerEntries = Object.entries(request.headers).map(
      ([key, value]) => [key, value?.toString() || ""] as [string, string]
    );
    const headers = new Headers(headerEntries);
    headers.set("Host", request.host);

    const res = await fetch(`${request.url}`, { headers });
    return res;
  } catch {
    replay.status(503).send();
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
