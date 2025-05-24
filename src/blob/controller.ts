import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  mkdir,
  readdir,
  rm,
  stat,
  writeFile,
  readFile,
} from "node:fs/promises";
import { config } from "../config.js";
import { extractRawContent } from "./helpers.js";
import { createReadStream, existsSync } from "node:fs";
import mime from "mime-types";
import path, { join } from "node:path";
import { createHash } from "node:crypto";

function getHeaders(request: FastifyRequest) {
  const rebaseHeaders = (
    Object.keys(request.headers).filter((value) =>
      value.toLowerCase().startsWith("x-rebase-")
    ) as string[]
  ).reduce<Record<string, string | string[] | undefined>>((prev, curr) => {
    prev[curr] = request.headers[curr];
    return prev;
  }, {});
  const [contentType] = request.headers["content-type"]?.split(";")!;

  return {
    headers: {
      ["content-type"]: contentType,
      ...rebaseHeaders,
    },
  };
}

function isValidId(id: string) {
  return /^[a-zA-Z0-9._-]+$/.test(id);
}

const dirSize = async (dir: string): Promise<number> => {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async (file) => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return await dirSize(path);

    if (file.isFile()) {
      const { size } = await stat(path);

      return size;
    }

    return 0;
  });

  return (await Promise.all(paths))
    .flat(Infinity)
    .reduce((i, size) => i + size, 0);
};

async function countFiles(directoryPath: string) {
  try {
    const files = await readdir(directoryPath);
    const fileCount = files.filter(async (file) => {
      return (await stat(path.join(directoryPath, file))).isFile();
    }).length;
    return fileCount;
  } catch (error) {
    if ((error as { code: "ENOENT" }).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function getFullFileDir(basePath: string, fileName: string) {
  const hash = createHash("md5").update(fileName).digest("hex");
  let dirName = `${basePath}/${hash.slice(0, 2)}`;
  let cursor = 2;
  while (hash) {
    if (existsSync(`${dirName}/${fileName}`)) {
      return dirName;
    }

    const fileCount = await countFiles(dirName);

    if (fileCount === null) {
      return dirName;
    }

    if (fileCount < config.MAX_BLOBS_IN_FOLDER) {
      return dirName;
    }
    dirName = `${dirName}/${hash.slice(cursor, cursor + 2)}`;
    cursor += 2;
  }

  return dirName;
}

async function routes(fastify: FastifyInstance, options: object) {
  fastify.addContentTypeParser("*", function (request, payload, done) {
    done(null, request);
  });

  fastify.get(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply
    ) => {
      const fullFilePath = `${await getFullFileDir(
        config.BLOBS_DIR,
        request.params.id
      )}/${request.params.id}`;

      if (!existsSync(fullFilePath)) {
        reply.status(404).send();
        return;
      }

      const readStream = createReadStream(fullFilePath);
      const { headers } = JSON.parse(
        (
          await readFile(`${config.METADATA_DIR}/${request.params.id}.metadata`)
        ).toString("ascii")
      );

      reply.header(
        "content-type",
        headers?.["content-type"] ??
          (mime.lookup(fullFilePath) || "application/octet-stream")
      );

      reply.headers(headers);

      reply.send(readStream);
    }
  );

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply
    ) => {
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

      if (blobDirSize + metadataDirSize > config.MAX_DISK_QUOTA) {
        reply.code(507).send({
          errorMessage: "Storage quota exceeded",
        });
        return;
      }

      const headers = Buffer.from(JSON.stringify(getHeaders(request)), "ascii");

      const payloadLength =
        headers.byteLength + parseInt(request.headers["content-length"]);

      if (payloadLength > config.MAX_LENGTH) {
        reply.code(413).send({
          errorMessage: "Payload too large",
        });
        return;
      }

      if (headers.byteLength > config.MAX_HEADER_LENGTH) {
        reply.code(413).send({
          errorMessage: "Header payload too large",
        });
        return;
      }

      if (
        !isValidId(request.params.id) ||
        request.params.id.length > config.MAX_ID_LENGTH
      ) {
        return reply.code(400).send({
          errorMessage: `Invalid ID format. Only alphanumeric characters, periods, underscores, and hyphens are allowed, with a maximum length of ${config.MAX_ID_LENGTH} characters.`,
        });
      }

      const fileDir = await getFullFileDir(config.BLOBS_DIR, request.params.id);
      const fullFilePath = `${fileDir}/${request.params.id}`;

      await mkdir(fileDir, {
        recursive: true,
      });

      extractRawContent(request, fullFilePath);
      writeFile(
        `${config.METADATA_DIR}/${request.params.id}.metadata`,
        headers
      );

      return reply.code(204).send();
    }
  );

  fastify.delete(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply
    ) => {
      const fullFilePath = `${await getFullFileDir(
        config.BLOBS_DIR,
        request.params.id
      )}/${request.params.id}`;

      if (!existsSync(fullFilePath)) {
        return;
      }

      try {
        await Promise.all([
          rm(fullFilePath),
          rm(`${config.METADATA_DIR}/${request.params.id}.metadata`),
        ]);
      } catch (error) {
        fastify.log.error({
          err: error,
          msg: `Error deleting files for ${request.params.id}`,
        });

        return reply.code(500).send();
      }

      return reply.code(204).send();
    }
  );
}

export default routes;
