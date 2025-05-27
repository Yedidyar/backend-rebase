import type { BlobHeaders, BlobRequest } from "../types.js";
import mime from "mime-types";

export function getHeaders(request: BlobRequest): { headers: BlobHeaders } {
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
      ["content-type"]:
        mime.lookup(request.params.id) || "application/octet-stream",
      ...rebaseHeaders,
    },
  };
}
