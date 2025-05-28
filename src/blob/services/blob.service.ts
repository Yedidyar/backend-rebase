import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { config } from "../../config.js";
import { getFullFileDir } from "../utils/filesystem.js";
import { extractRawContent } from "../helpers.js";
import type { BlobMetadata } from "../types.js";

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
      metadataContent.toString("ascii")
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

    await Promise.all([
      rm(`${blobDir}/${id}.metadata`),
      rm(`${metadataDir}/${id}.metadata`),
    ]);

    return true;
  }
}
