import Fastify from "fastify";

const fastify = Fastify();

fastify.get("*", async (request, replay) => {
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
