import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import {
  type PageViewsFilters,
  pageViewsFiltersSchema,
} from "../schemas/page-views.ts";
import { logger } from "../index.ts";

export type GetPageViewsRequest = {
  Params: { page: string };
  Query: PageViewsFilters;
};

export async function getPageViewsHandler(
  request: FastifyRequest<GetPageViewsRequest>,
  reply: FastifyReply,
) {
  try {
    const pageName = request.params?.page;
    if (!pageName) {
      return reply
        .status(400)
        .send("Page name is required for analytics response");
    }
    const filters = pageViewsFiltersSchema.parse(request.query);

    const data = await request.server.pageViewsRepository.getPageViews(
      pageName,
      filters?.now,
      filters?.order,
      filters?.take,
    );

    return reply.send(data);
  } catch (error) {
    logger.error({
      action: "GET PAGE VIEWS",
      message: `Couldn't get page views for page '${request?.params?.page}', \n error: ${(error as Error)?.message ?? "n/a"}`,
      cause: (error as Error)?.cause,
      page: request?.params?.page,
    });
    return reply.status(500).send("Couldn't get user");
  }
}

export async function pageViewsRoutes(
  fastify: FastifyInstance,
  options: object,
) {
  fastify.get<GetPageViewsRequest>("/:page", getPageViewsHandler);
}
