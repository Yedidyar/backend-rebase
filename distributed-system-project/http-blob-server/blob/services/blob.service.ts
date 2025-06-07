import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { config } from "../../config.ts";
import { getFullFileDir } from "../utils/filesystem.ts";
import { extractRawContent } from "../helpers.ts";
import type { BlobMetadata } from "../types.ts";
import { logger } from "../../logger/index.ts";

export class BlobService {
  static async getBlob(id: string) {
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
  }

  static async createBlob(id: string, request: any, headers: Buffer) {
    const blobDir = getFullFileDir(config.BLOBS_DIR, id);
    const metadataDir = getFullFileDir(config.METADATA_DIR, id);

    await mkdir(blobDir, { recursive: true });
    await mkdir(metadataDir, { recursive: true });

    await extractRawContent(request, `${blobDir}/${id}`);
    await writeFile(`${metadataDir}/${id}.metadata`, headers);
  }

  static async deleteBlob(id: string): Promise<boolean> {
    const blobDir = getFullFileDir(config.BLOBS_DIR, id);
    const metadataDir = getFullFileDir(config.METADATA_DIR, id);

    if (!existsSync(blobDir) || !existsSync(metadataDir)) {
      return false;
    }
    const [blobDeleteResult, metadataDeleteResult] = await Promise.allSettled([
      rm(`${blobDir}/${id}`),
      rm(`${metadataDir}/${id}.metadata`),
    ]);

    if (blobDeleteResult.status === "rejected") {
      logger.error(
        `Failed to delete blob file for ID ${id}: ${blobDeleteResult.reason}`,
      );
    }

    if (metadataDeleteResult.status === "rejected") {
      logger.error(
        `Failed to delete metadata file for ID ${id}: ${metadataDeleteResult.reason}`,
      );
    }

    return true;
  }
}
