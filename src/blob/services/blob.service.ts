import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import mime from "mime-types";
import { config } from "../../config.js";
import { getFullFileDir } from "../utils/filesystem.js";
import { extractRawContent } from "../helpers.js";
import type { BlobMetadata } from "../types.js";

export class BlobService {
  static async getBlob(id: string) {
    const fullFilePath = `${await getFullFileDir(config.BLOBS_DIR, id)}/${id}`;

    if (!existsSync(fullFilePath)) {
      return null;
    }

    const readStream = createReadStream(fullFilePath);
    const metadataContent = await readFile(
      `${config.METADATA_DIR}/${id}.metadata`
    );
    const metadata: BlobMetadata = JSON.parse(
      metadataContent.toString("ascii")
    );

    const contentType =
      metadata.headers?.["content-type"] ??
      (mime.lookup(fullFilePath) || "application/octet-stream");

    return {
      stream: readStream,
      headers: metadata.headers,
      contentType,
    };
  }

  static async createBlob(id: string, request: any, headers: Buffer) {
    const fileDir = await getFullFileDir(config.BLOBS_DIR, id);
    const fullFilePath = `${fileDir}/${id}`;

    await mkdir(fileDir, { recursive: true });

    await Promise.all([
      extractRawContent(request, fullFilePath),
      writeFile(`${config.METADATA_DIR}/${id}.metadata`, headers),
    ]);
  }

  static async deleteBlob(id: string): Promise<boolean> {
    const fullFilePath = `${await getFullFileDir(config.BLOBS_DIR, id)}/${id}`;

    if (!existsSync(fullFilePath)) {
      return false;
    }

    await Promise.all([
      rm(fullFilePath),
      rm(`${config.METADATA_DIR}/${id}.metadata`),
    ]);

    return true;
  }
}
