import type { FastifyReply, FastifyRequest } from "fastify";
import { NodeRegistrationService } from "../services/cache.service.ts";

export async function getNodes(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const nodes = await NodeRegistrationService.getAll();
  return reply.code(200).send(nodes);
}
