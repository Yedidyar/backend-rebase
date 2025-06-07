import type { FastifyReply } from "fastify";
import type { RegisteredNode, RegisteredNodeRequest } from "../types.ts";
import { NodeRegistrationService } from "../services/internal/nodes.service.ts";

export async function postNodes(
  request: RegisteredNodeRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  NodeRegistrationService.addNode(JSON.parse(request.body) as RegisteredNode);
  return reply.code(201).send();
}
