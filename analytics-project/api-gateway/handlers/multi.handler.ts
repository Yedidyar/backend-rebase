import { type FastifyRequest, type FastifyReply } from "fastify";

export const multiHandler = async (
  req: FastifyRequest<{ Body: Record<string, Record<string, number>> }>,
  res: FastifyReply,
) => {
  await Promise.allSettled(
    Object.entries(req.body).map(async ([page, timestamps]) => {
      return req.server.partitionerService.publishWithKey(
        { [page]: timestamps },
        page,
      );
    }),
  );
  res.status(200).send();
};
