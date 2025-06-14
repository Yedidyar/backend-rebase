import type { FastifyInstance } from "fastify";
import { getNodes } from "./handlers/get.handler.ts";
import { postNodes } from "./handlers/post.handler.ts";

export async function nodeRegistrationRouter(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.get("/nodes", getNodes);
  fastify.post("/nodes", postNodes);
}
