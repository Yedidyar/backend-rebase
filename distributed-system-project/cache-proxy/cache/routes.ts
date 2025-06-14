import type { FastifyInstance } from "fastify";
import {
  deleteBlobHandler,
  getBlobHandler,
  postBlobHandler,
} from "./handlers/index.ts";

export async function blobCachedRoutes(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.get<{ Params: { id: string } }>("/:id", getBlobHandler);
  fastify.post<{ Params: { id: string } }>("/:id", postBlobHandler);
  fastify.delete<{ Params: { id: string } }>("/:id", deleteBlobHandler);
}
