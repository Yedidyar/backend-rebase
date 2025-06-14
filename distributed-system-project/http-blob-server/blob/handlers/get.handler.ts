import type { FastifyReply } from "fastify";
import { BlobService, GetBlobError } from "../services/blob.service.ts";
import type { BlobRequest } from "../types.ts";
import { logger } from "../../../logger/index.ts";

export async function getBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  try {
    logger.debug({
      blobId: request?.params?.id,
      msg: "retrieving blob",
    });
    const blob = await BlobService.getBlob(request.params.id);

    if (!blob) {
      return reply.status(404).send();
    }

    reply.headers(blob.headers);
    reply.type(blob.contentType);
    return reply.send(blob.stream);
  } catch (error) {
    if (error instanceof GetBlobError) {
      logger.error({
        blobId: request?.params?.id,
        msg: error.message,
        action: error.name,
        cause: error.cause,
      });
    }
    return reply.code(500).send();
  }
}
