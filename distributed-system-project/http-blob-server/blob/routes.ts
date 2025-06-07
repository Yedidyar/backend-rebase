import type { FastifyInstance } from "fastify";
import { getBlobHandler } from "./handlers/get.handler.ts";
import { postBlobHandler } from "./handlers/post.handler.ts";
import { deleteBlobHandler } from "./handlers/delete.handler.ts";
import type { BlobRequest } from "./types.ts";

export async function blobRoutes(fastify: FastifyInstance, options: object) {
  fastify.addContentTypeParser("*", function (request, payload, done) {
    done(null, request);
  });

  fastify.get<{ Params: { id: string } }>("/:id", getBlobHandler);
  fastify.post<{ Params: { id: string } }>("/:id", postBlobHandler);
  fastify.delete<{ Params: { id: string } }>("/:id", (request, reply) =>
    deleteBlobHandler(request as BlobRequest, reply, fastify),
  );
}
