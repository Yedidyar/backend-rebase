import type { FastifyReply } from "fastify";
import type { RegisteredNodeRequest } from "../types.ts";
import { NodeRegistrationService } from "../services/internal/nodes.service.ts";

export async function postNodes(
  request: RegisteredNodeRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  await NodeRegistrationService.addNode(request.body);
  return reply.code(201).send();
}
