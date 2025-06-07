import type { FastifyRequest } from "fastify";
import { createWriteStream } from "node:fs";

export async function extractRawContent(
  request: FastifyRequest,
  filePath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(filePath);

    request.raw.on("data", (chunk) => {
      writeStream.write(chunk);
    });

    request.raw.on("end", () => {
      writeStream.end();
      resolve();
    });

    request.raw.on("error", (err) => {
      writeStream.end();
      reject(err);
    });

    writeStream.on("error", (err) => {
      reject(err);
    });
  });
}
