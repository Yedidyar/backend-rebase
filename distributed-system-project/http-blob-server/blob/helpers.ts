import type { FastifyRequest } from "fastify";
import { createWriteStream } from "node:fs";

export async function extractRawContent(
  raw: FastifyRequest["raw"],
  filePath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(filePath);

    raw.on("data", (chunk) => {
      writeStream.write(chunk);
    });

    raw.on("end", () => {
      writeStream.end();
      resolve();
    });

    raw.on("error", (err) => {
      writeStream.end();
      reject(err);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });
  });
}
