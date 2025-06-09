import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { config } from "../../config.ts";
import { getFullFileDir } from "../utils/filesystem.ts";
import { extractRawContent } from "../helpers.ts";
import type { BlobMetadata } from "../types.ts";
import type { FastifyRequest } from "fastify";

export class GetBlobError extends Error {
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "Error in getting blob";
  }
}

export class DeleteBlobError extends Error {
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "Error in deleting blob";
  }
}

export class SaveBlobError extends Error {
  constructor(message?: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "Error in saving blob";
  }
}

function extractMessageFromError(error?: unknown): string | undefined {
  if (
    error &&
    error instanceof Error &&
    "message" in error &&
    typeof error.message == "string"
  ) {
    return error.message;
  }
  return undefined;
}

export class BlobService {
  static async getBlob(id: string) {
    try {
      const blobDir = getFullFileDir(config.BLOBS_DIR, id);
      const metadataDir = getFullFileDir(config.METADATA_DIR, id);

      if (!existsSync(blobDir) || !existsSync(metadataDir)) {
        return null;
      }

      const readStream = createReadStream(`${blobDir}/${id}`);
      const metadataContent = await readFile(`${metadataDir}/${id}.metadata`);
      const metadata: BlobMetadata = JSON.parse(
        metadataContent.toString("ascii"),
      );

      const contentType = metadata.headers["content-type"];

      return {
        stream: readStream,
        headers: metadata.headers,
        contentType,
      };
    } catch (error) {
      throw new GetBlobError(extractMessageFromError(error));
    }
  }

  static async createBlob(
    id: string,
    raw: FastifyRequest["raw"],
    headers: Buffer,
  ) {
    try {
      const blobDir = getFullFileDir(config.BLOBS_DIR, id);
      const metadataDir = getFullFileDir(config.METADATA_DIR, id);

      await mkdir(blobDir, { recursive: true });
      await mkdir(metadataDir, { recursive: true });

      await extractRawContent(raw, `${blobDir}/${id}`);
      await writeFile(`${metadataDir}/${id}.metadata`, headers);
    } catch (error) {
      throw new SaveBlobError(extractMessageFromError(error), { cause: error });
    }
  }

  static async deleteBlob(id: string): Promise<boolean> {
    try {
      const blobDir = getFullFileDir(config.BLOBS_DIR, id);
      const metadataDir = getFullFileDir(config.METADATA_DIR, id);

      if (!existsSync(blobDir) || !existsSync(metadataDir)) {
        return false;
      }
      const [blobDeleteResult, metadataDeleteResult] = await Promise.allSettled(
        [rm(`${blobDir}/${id}`), rm(`${metadataDir}/${id}.metadata`)],
      );

      if (
        [metadataDeleteResult.status, blobDeleteResult.status].includes(
          "rejected",
        )
      ) {
        const errorMessages = [];

        if (metadataDeleteResult.status === "rejected")
          errorMessages.push("Couldn't delete metadata");
        if (blobDeleteResult.status === "rejected")
          errorMessages.push("Couldn't delete blob");

        const message = errorMessages.join("\n");

        throw new Error(message);
      }

      return true;
    } catch (error) {
      throw new DeleteBlobError(extractMessageFromError(error), {
        cause: error,
      });
    }
  }
}
