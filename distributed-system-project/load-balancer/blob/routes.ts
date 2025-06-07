import type { FastifyInstance } from "fastify";
import { getNodes } from "./handlers/get.handler.ts";
import { postNodes } from "./handlers/post.handler.ts";

export async function nodeRegistrationRouter(
  fastify: FastifyInstance,
  options: object
) {
  fastify.get("/internal/nodes/", getNodes);
  fastify.post("/internal/nodes/", postNodes);
}
