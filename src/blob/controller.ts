import type { FastifyInstance, FastifyRequest } from "fastify";
import { createWriteStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import { config } from "../config.js";

function getHeaders(request: FastifyRequest) {
  const rebaseHeaders = (
    Object.values(request.headers).filter(
      (value) =>
        typeof value === "string" && value.toLowerCase().startsWith("x-rebase-")
    ) as string[]
  ).map((value) => request.headers[value]);
  const [contentType] = request.headers["content-type"]?.split(";")!;

  return {
    headers: {
      contentType,
      "x-rebase-*": rebaseHeaders,
    },
  };
}
async function routes(fastify: FastifyInstance, options: object) {
  // fastify.addContentTypeParser("multipart/form-data", (req, _payload, done) => {
  //   done(null, req);
  // });

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
      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(
          `${config.BLOBS_DIR}/${request.params.id}`
        );
        request.raw.on("data", (chunk) => {
          writeStream.write(chunk);
        });

        writeFile(
          `${config.METADATA_DIR}/${request.params.id}.metadata`,
          JSON.stringify(getHeaders(request))
        );
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

      return { hello: "world" };
    }
  );
}

export default routes;
