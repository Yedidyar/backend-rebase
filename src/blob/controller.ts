import type { FastifyInstance, FastifyRequest } from "fastify";
import { writeFile } from "node:fs/promises";
import { config } from "../config.js";
import { extractRawContent } from "./helpers.js";

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

      return { hello: "world" };
    }
  );
}

export default routes;
