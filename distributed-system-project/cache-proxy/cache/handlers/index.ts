import { LRUCacheService } from "./../services/cache.service.ts";
import { config } from "../../config.ts";
import axios, { AxiosError } from "axios";
import { toTitleCase } from "../../../string-utils/to-title-case.ts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../index.ts";

const cache = new LRUCacheService(config.MAX_ITEMS_IN_CACHE);

export type BlobRequest = FastifyRequest<{
  Params: { id: string };
}>;

function getHeaders(request: FastifyRequest) {
  const headers: Record<string, string | string[]> = {};

  Object.entries(request.headers).forEach(([key, value]) => {
    if (value === undefined) return;

    headers[toTitleCase(key)] = value;
  });

  headers["Host"] = request.host;

  return headers;
}

export async function getBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  const value = cache.tryGet(request.params.id);
  if (value) {
    return reply.header("X-Cache", "HIT").send(value.value[1]).status(200);
  }
  try {
    const res = await axios.request({
      baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
      headers: getHeaders(request),
      method: request.method,
      data: request.body,
    });

    cache.put(request.params.id, res.data);

    return reply.header("X-Cache", "MISS").send(res.data);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;

      if (status === 404) {
        return reply.status(404).send({ error: "Resource not found" });
      }

      logger.error({
        blobId: request.params.id,
        msg: "Bad response from downstream service",
        action: "GET blob",
        cause: axiosError.cause,
      });

      return reply.status(status).send({
        error: "downstream error",
        status,
        message: axiosError.response.data ?? axiosError.message,
      });
    }

    if (axiosError.request) {
      logger.error({
        blobId: request.params.id,
        msg: "No response from downstream service",
        action: "GET blob",
        cause: axiosError.cause,
      });
      return reply
        .status(502)
        .send({ error: "No response from downstream service" });
    }
    logger.error({
      blobId: request.params.id,
      msg: "Internal server error",
      action: "GET blob",
      cause: axiosError.cause,
    });
    return reply
      .status(500)
      .send({ error: "Internal server error", message: axiosError.message });
  }
}

export async function postBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  try {
    const res = await axios.request({
      baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
      headers: getHeaders(request),
      method: request.method,
      data: request.body,
    });

    cache.put(request.params.id, res.data);

    return reply.status(201).send();
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;

      return reply.status(status).send({
        error: "downstream error",
        status,
        message: axiosError.response.data ?? axiosError.message,
      });
    }

    if (axiosError.request) {
      logger.error({
        blobId: request.params.id,
        msg: "No response from downstream service",
        action: "POST blob",
        cause: axiosError.cause,
      });
      return reply
        .status(502)
        .send({ error: "No response from downstream service" });
    }

    logger.error({
      blobId: request.params.id,
      msg: "Internal server error",
      action: "POST blob",
      cause: axiosError.cause,
    });

    return reply
      .status(500)
      .send({ error: "Internal server error", message: axiosError.message });
  }
}

export async function deleteBlobHandler(
  request: BlobRequest,
  reply: FastifyReply,
) {
  try {
    await axios.request({
      baseURL: `http://${config.LOAD_BALANCER_ADDRESS}/blobs/${request.params.id}`,
      headers: getHeaders(request),
      method: request.method,
      data: request.body,
    });

    cache.remove(request.params.id);

    return reply.status(204);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response) {
      const status = axiosError.response.status;

      return reply.status(status).send({
        error: "downstream error",
        status,
        message: axiosError.response.data ?? axiosError.message,
      });
    }

    if (axiosError.request) {
      logger.error({
        blobId: request.params.id,
        msg: "No response from downstream service",
        action: "DELETE blob",
        cause: axiosError.cause,
      });
      return reply
        .status(502)
        .send({ error: "No response from downstream service" });
    }

    logger.error({
      blobId: request.params.id,
      msg: "Internal server error",
      action: "DELETE blob",
      cause: axiosError.cause,
    });

    return reply
      .status(500)
      .send({ error: "Internal server error", message: axiosError.message });
  }
}
