import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { logger } from "../index.ts";
import { HTTP_STATUS, ERROR_MESSAGES } from "../constants/index.ts";

type ValidationResult = {
  isValid: boolean;
  error?: string;
  details?: string;
};

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
    patternProperties: {
      "^.+$": {
        type: "object",
        patternProperties: {
          "^.+$": { type: "number", minimum: 0 },
        },
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

function validateSingleIncrement(
  page: string,
  timestamp: string,
): ValidationResult {
  if (!page || typeof page !== "string" || page.trim().length === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_PAGE,
      details: `Invalid page identifier: '${page}'. Page must be a non-empty string.`,
    };
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_TIMESTAMP,
      details: `Invalid timestamp format: '${timestamp}'. Expected ISO 8601 format.`,
    };
  }

  return { isValid: true };
}

function validateMultipleIncrements(
  pageData: Record<string, Record<string, number>>,
): ValidationResult {
  if (!pageData || typeof pageData !== "object") {
    return {
      isValid: false,
      error: "Invalid input data",
      details: "Invalid page data: expected object with page names as keys",
    };
  }

  for (const [page, timeData] of Object.entries(pageData)) {
    if (!page || typeof page !== "string" || page.trim().length === 0) {
      return {
        isValid: false,
        error: "Invalid input data",
        details: `Invalid page identifier: '${page}'. Page must be a non-empty string.`,
      };
    }

    if (!timeData || typeof timeData !== "object") {
      return {
        isValid: false,
        error: "Invalid input data",
        details: `Invalid time data for page '${page}': expected object with timestamps as keys.`,
      };
    }

    for (const [timeKey, value] of Object.entries(timeData)) {
      const date = new Date(timeKey);
      if (isNaN(date.getTime())) {
        return {
          isValid: false,
          error: "Invalid input data",
          details: `Invalid timestamp format for page '${page}' at time '${timeKey}': expected ISO 8601 format.`,
        };
      }

      if (typeof value !== "number" || value < 0 || !Number.isInteger(value)) {
        return {
          isValid: false,
          error: "Invalid input data",
          details: `Invalid increment value for page '${page}' at time '${timeKey}': expected non-negative integer, got ${value}.`,
        };
      }
    }
  }

  return { isValid: true };
}

export async function createOrUpdateSingleIncrementHandler(
  request: CreateOrUpdateSingleIncrementRequest,
  reply: FastifyReply,
) {
  try {
    const { page, timestamp } = request.body;

    const validation = validateSingleIncrement(page, timestamp);
    if (!validation.isValid) {
      return reply.status(HTTP_STATUS.BAD_REQUEST).send({
        error: validation.error,
        details: validation.details,
      });
    }

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

    const validation = validateMultipleIncrements(pageData);
    if (!validation.isValid) {
      return reply.status(HTTP_STATUS.BAD_REQUEST).send({
        error: validation.error,
        details: validation.details,
      });
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
