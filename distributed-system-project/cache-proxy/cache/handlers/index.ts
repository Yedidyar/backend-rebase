import { LRUCacheService } from "./../services/cache.service.ts";
import { config } from "../../config.ts";
import axios from "axios";
import { toTitleCase } from "../../../string-utils/to-title-case.ts";
import type { FastifyReply, FastifyRequest } from "fastify";

const cache = new LRUCacheService(config.MAX_ITEMS_IN_CACHE);

export type BlobRequest = FastifyRequest<{
  Params: { id: string };
}>;

function getHeaders(request: FastifyRequest) {
  const headerEntries = Object.entries(request.headers).map(
    ([key, value]) =>
      [toTitleCase(key), value?.toString() || ""] as [string, string],
  );
  const headers = new Headers(headerEntries);
  headers.set("Host", request.host);

  return headers;
}

export async function getBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  const value = cache.tryGet(request.params.id);
  if (value) {
    return reply.header("X-Cache", "HIT").send(value).status(200);
  }

  const res = await axios.request({
    baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
    headers: getHeaders(request) as any,
    method: request.method,
    data: request.body,
  });

  cache.put(request.params.id, res.data);

  return reply.header("X-Cache", "MISS").send(res.data);
}

export async function postBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  const res = await axios.request({
    baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
    headers: getHeaders(request) as any,
    method: request.method,
    data: request.body,
  });

  cache.put(request.params.id, res.data);

  return reply.status(201);
}

export async function deleteBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  await axios.request({
    baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
    headers: getHeaders(request) as any,
    method: request.method,
    data: request.body,
  });

  cache.remove(request.params.id);

  return reply.status(204);
}
