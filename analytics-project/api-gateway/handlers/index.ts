import { type FastifyInstance } from "fastify";
import { reportHandler } from "./report.handler.ts";
import { singleHandler } from "./single.handler.ts";
import { multiHandler } from "./multi.handler.ts";

export const routes = async (fastify: FastifyInstance) => {
  fastify.get("/report/:page", reportHandler);
  fastify.post("/single", singleHandler);
  fastify.post("/multi", multiHandler);
};
