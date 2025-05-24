import type { FastifyRequest } from "fastify";
import type { BlobHeaders } from "../types.js";

export function getHeaders(request: FastifyRequest): { headers: BlobHeaders } {
  const rebaseHeaders = (
    Object.keys(request.headers).filter((value) =>
      value.toLowerCase().startsWith("x-rebase-")
    ) as string[]
  ).reduce<Record<string, string | string[] | undefined>>((prev, curr) => {
    prev[curr] = request.headers[curr];
    return prev;
  }, {});

  const contentType = request.headers["content-type"];
  const parsedContentType =
    contentType?.split(";")[0] ?? "application/octet-stream";

  return {
    headers: {
      ["content-type"]: parsedContentType,
      ...rebaseHeaders,
    },
  };
}
