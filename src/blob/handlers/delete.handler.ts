import type { FastifyReply, FastifyInstance } from "fastify";
import { BlobService } from "../services/blob.service.js";
import type { BlobRequest } from "../types.js";

export async function deleteBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
  fastify: FastifyInstance
): Promise<FastifyReply> {
  try {
    await BlobService.deleteBlob(request.params.id);

    return reply.code(204).send();
  } catch (error) {
    fastify.log.error({
      err: error,
      msg: `Error deleting files for ${request.params.id}`,
    });

    return reply.code(500).send();
  }
}
