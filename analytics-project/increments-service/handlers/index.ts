import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { logger } from "../index.ts";

export type CreateOrUpdateSingleIncrementRequest = FastifyRequest<{
  Body: { page: string; timestamp: string };
}>;

export type CreateOrUpdateMultiIncrementRequest = FastifyRequest<{
  Body: Record<string, Record<string, number>>;
}>;

export async function createOrUpdateSingleIncrementHandler(
  request: CreateOrUpdateSingleIncrementRequest,
  reply: FastifyReply,
) {
  try {
    const { page, timestamp } = request.body;

    await request.server.incrementsService.incrementPage(page, timestamp);
    return reply.status(200).send({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      logger.error({
        action: "INCREMENT PAGE",
        message: err.message,
        cause: err.cause,
      });
    }

    return reply.status(500).send("Couldn't increment page");
  }
}

export async function createOrUpdateMultiIncrementHandler(
  request: CreateOrUpdateMultiIncrementRequest,
  reply: FastifyReply,
) {
  try {
    const pageData = request.body;

    await request.server.incrementsService.incrementMultiplePages(pageData);
    return reply.status(200).send({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      logger.error({
        action: "INCREMENT MULTIPLE PAGES",
        message: err.message,
        cause: err.cause,
      });
    }

    return reply.status(500).send("Couldn't increment multiple pages");
  }
}

export async function incrementsRoutes(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.post<{ Body: { page: string; timestamp: string } }>(
    "/single",
    createOrUpdateSingleIncrementHandler,
  );
  fastify.post<{ Body: Record<string, Record<string, number>> }>(
    "/multi",
    createOrUpdateMultiIncrementHandler,
  );
}
