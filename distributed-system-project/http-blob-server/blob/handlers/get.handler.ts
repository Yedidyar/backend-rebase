import type { FastifyReply } from "fastify";
import { BlobService } from "../services/blob.service.ts";
import type { BlobRequest } from "../types.ts";

export async function getBlobHandler(
  request: BlobRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  const blob = await BlobService.getBlob(request.params.id);

  if (!blob) {
    return reply.status(404).send();
  }

  reply.headers(blob.headers);
  reply.type(blob.contentType);
  return reply.send(blob.stream);
}
