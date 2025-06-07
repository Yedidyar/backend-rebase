import type { FastifyReply, FastifyInstance } from "fastify";
import { BlobService } from "../services/blob.service.ts";
import type { BlobRequest } from "../types.ts";
import { logger } from "../../logger/index.ts";

export async function deleteBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
  fastify: FastifyInstance
): Promise<FastifyReply> {
  try {
    await BlobService.deleteBlob(request.params.id);

    return reply.code(204).send();
  } catch (error) {
    logger.error({
      err: error,
      msg: `Error deleting files for ${request.params.id}`,
    });

    return reply.code(500).send();
  }
}
