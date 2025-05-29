import Fastify from "fastify";

const fastify = Fastify();

fastify.get("*", async (request, replay) => {
  try {
    const res = await fetch(`${request.url}`, {
      headers: { ...request.headers, Host: request.host },
    });
    return res;
  } catch {
    replay.status(502).send();
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
