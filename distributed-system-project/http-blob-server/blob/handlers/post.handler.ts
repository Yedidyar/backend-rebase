import type { FastifyReply } from "fastify";
import { config } from "../../config.ts";
import { dirSize } from "../utils/filesystem.ts";
import { getHeaders } from "../utils/headers.ts";
import { isValidId } from "../utils/validation.ts";
import { BlobService } from "../services/blob.service.ts";
import type { BlobRequest } from "../types.ts";

export async function postBlobHandler(
  request: BlobRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  console.log("I am here");

  if (Object.keys(request.headers).length > config.MAX_HEADER_COUNT) {
    return reply.code(413).send({
      errorMessage: "Too many headers",
    });
  }

  if (!request.headers["content-length"]) {
    return reply.status(400).send({
      errorMessage: "Content-Length header is required",
    });
  }

  const blobDirSize = await dirSize(config.BLOBS_DIR);
  const metadataDirSize = await dirSize(config.METADATA_DIR);

  if (
    typeof request.headers["content-length"] !== "string" ||
    isNaN(parseInt(request.headers["content-length"]))
  ) {
    return reply.status(400).send({
      errorMessage: "Content-Length header must be a valid number",
    });
  }

  const headers = Buffer.from(JSON.stringify(getHeaders(request)), "ascii");
  const payloadLength =
    headers.byteLength + parseInt(request.headers["content-length"]);

  if (payloadLength + blobDirSize + metadataDirSize > config.MAX_DISK_QUOTA) {
    return reply.code(507).send({
      errorMessage: "Storage quota exceeded",
    });
  }

  if (payloadLength > config.MAX_LENGTH) {
    return reply.code(413).send({
      errorMessage: "Payload too large",
    });
  }

  if (headers.byteLength > config.MAX_HEADER_LENGTH) {
    return reply.code(413).send({
      errorMessage: "Header payload too large",
    });
  }

  if (
    !isValidId(request.params.id) ||
    request.params.id.length > config.MAX_ID_LENGTH
  ) {
    return reply.code(400).send({
      errorMessage: `Invalid ID format. Only alphanumeric characters, periods, underscores, and hyphens are allowed, with a maximum length of ${config.MAX_ID_LENGTH} characters.`,
    });
  }

  await BlobService.createBlob(request.params.id, request, headers);
  return reply.code(204).send();
}
