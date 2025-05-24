import type { FastifyInstance } from "fastify";
import { getBlobHandler } from "./handlers/get.handler.js";
import { postBlobHandler } from "./handlers/post.handler.js";
import { deleteBlobHandler } from "./handlers/delete.handler.js";
import type { BlobRequest } from "./types.js";

export async function blobRoutes(fastify: FastifyInstance, options: object) {
  fastify.addContentTypeParser("*", function (request, payload, done) {
    done(null, request);
  });

  fastify.get<{ Params: { id: string } }>("/:id", getBlobHandler);
  fastify.post<{ Params: { id: string } }>("/:id", postBlobHandler);
  fastify.delete<{ Params: { id: string } }>("/:id", (request, reply) =>
    deleteBlobHandler(request as BlobRequest, reply, fastify)
  );
}
