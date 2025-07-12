import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { logger } from "../index.ts";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/index.ts";

const singleIncrementSchema = {
  body: {
    type: "object",
    required: ["page", "timestamp"],
    properties: {
      page: { type: "string", minLength: 1, maxLength: 255 },
      timestamp: { type: "string", format: "date-time" },
    },
    additionalProperties: false,
  },
};

const multiIncrementSchema = {
  body: {
    type: "object",
    minProperties: 1,
    patternProperties: {
      "^.+$": {
        type: "object",
        minProperties: 1,
        patternProperties: {
          "^.+$": { type: "number", minimum: 0 },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};

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
    return reply.status(HTTP_STATUS.OK).send();
  } catch (err) {
    if (err instanceof Error) {
      logger.error({
        action: "INCREMENT PAGE",
        message: err.message,
        cause: err.cause,
        page: request.body.page,
        timestamp: request.body.timestamp,
      });
    }

    return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: ERROR_MESSAGES.PAGE_INCREMENT_FAILED,
    });
  }
}

export async function createOrUpdateMultiIncrementHandler(
  request: CreateOrUpdateMultiIncrementRequest,
  reply: FastifyReply,
) {
  try {
    const pageData = request.body;

    if (!pageData || Object.keys(pageData).length === 0) {
      return reply.status(HTTP_STATUS.BAD_REQUEST).send({
        error: "Request body cannot be empty",
      });
    }

    for (const [page, timeData] of Object.entries(pageData)) {
      if (!page || page.trim().length === 0) {
        return reply.status(HTTP_STATUS.BAD_REQUEST).send({
          error: "Request body cannot be empty",
        });
      }

      for (const [timeKey] of Object.entries(timeData)) {
        const date = new Date(timeKey);
        if (isNaN(date.getTime())) {
          return reply.status(HTTP_STATUS.BAD_REQUEST).send({
            error: "Invalid input data",
            details: `Invalid timestamp format for page '${page}' at time '${timeKey}': expected ISO 8601 format.`,
          });
        }
      }
    }

    await request.server.incrementsService.incrementMultiplePages(pageData);
    return reply.status(HTTP_STATUS.OK).send();
  } catch (err) {
    if (err instanceof Error) {
      logger.error({
        action: "INCREMENT MULTIPLE PAGES",
        message: err.message,
        cause: err.cause,
        pageCount: Object.keys(request.body).length,
      });
    }

    return reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: ERROR_MESSAGES.BATCH_INCREMENT_FAILED,
    });
  }
}

export async function incrementsRoutes(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.post<{ Body: { page: string; timestamp: string } }>(
    "/single",
    { schema: singleIncrementSchema },
    createOrUpdateSingleIncrementHandler,
  );

  fastify.post<{ Body: Record<string, Record<string, number>> }>(
    "/multi",
    { schema: multiIncrementSchema },
    createOrUpdateMultiIncrementHandler,
  );
}
