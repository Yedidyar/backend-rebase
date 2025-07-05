import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { logger } from "../../analytics-service/index.ts";

export type CreateOrUpdateSingleIncrementRequest = FastifyRequest<{
  Body: { page: string; timestamp: string };
}>;

export async function createOrUpdateSingleIncrementHandler(
  request: CreateOrUpdateSingleIncrementRequest,
  reply: FastifyReply,
) {
  try {
    const { page, timestamp } = request.body;

    await request.server.incrementsService.incrementPage(page, timestamp);
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

export async function incrementsRoutes(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.post<{ Body: { page: string; timestamp: string } }>(
    "/single",
    createOrUpdateSingleIncrementHandler,
  );
}
