import type { FastifyInstance, FastifyRequest } from "fastify";
import { rm, writeFile } from "node:fs/promises";
import { config } from "../config.js";
import { extractRawContent } from "./helpers.js";
import { createReadStream, existsSync, rmSync } from "node:fs";
import mime from "mime-types";

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
      contentType,
      ...rebaseHeaders,
    },
  };
}

async function routes(fastify: FastifyInstance, options: object) {
  fastify.addContentTypeParser("*", function (request, payload, done) {
    done(null, request);
  });

  fastify.get(
    "/:id",
    (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply
    ) => {
      if (!existsSync(`${config.BLOBS_DIR}/${request.params.id}`)) {
        reply.status(404).send();
        return;
      }

      const readStream = createReadStream(
        `${config.BLOBS_DIR}/${request.params.id}`
      );

      reply.header(
        "content-type",
        mime.lookup(`${config.BLOBS_DIR}/${request.params.id}`) ||
          "application/octet-stream"
      );

      reply.send(readStream);
    }
  );

  fastify.post(
    "/:id",
    {
      schema: {
        consumes: ["multipart/form-data"],
        body: {
          type: "object",
          properties: {
            content: {
              type: "string",
            },
            media: {
              type: "string",
              format: "binary",
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply
    ) => {
      extractRawContent(request, `${config.BLOBS_DIR}/${request.params.id}`);
      writeFile(
        `${config.METADATA_DIR}/${request.params.id}.metadata`,
        JSON.stringify(getHeaders(request))
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
      if (!existsSync(`${config.BLOBS_DIR}/${request.params.id}`)) {
        return;
      }

      try {
        await Promise.allSettled([
          rm(`${config.BLOBS_DIR}/${request.params.id}`),
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
