import type { FastifyReply, FastifyInstance } from "fastify";
import { BlobService, DeleteBlobError } from "../services/blob.service.ts";
import type { BlobRequest } from "../types.ts";
import { logger } from "../../../logger/index.ts";

export async function deleteBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
  fastify: FastifyInstance,
): Promise<FastifyReply> {
  try {

    logger.debug({
      blobId: request?.params?.id,
      msg: 'deleting node',
    });
    await BlobService.deleteBlob(request.params.id);

    return reply.code(204).send();
  } catch (error) {
    if (error instanceof DeleteBlobError) {
      logger.error({
        blobId: request?.params?.id,
        msg: error.message,
        action: error.name,
      });
    }
    return reply.code(500).send();
  }
}
