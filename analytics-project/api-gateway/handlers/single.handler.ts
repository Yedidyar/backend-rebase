import { type FastifyRequest, type FastifyReply } from "fastify";

export const singleHandler = async (
  req: FastifyRequest<{ Body: { page: string; timestamp: string } }>,
  res: FastifyReply,
) => {
  const { page, timestamp } = req.body;
  const multiData = {
    [page]: {
      [timestamp]: 1,
    },
  };

  await req.server.partitionerService.publishWithKey(multiData, page);
  res.status(200).send();
};
