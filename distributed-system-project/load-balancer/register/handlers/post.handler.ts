import type { FastifyReply } from "fastify";
import type { RegisteredNode, RegisteredNodeRequest } from "../types.ts";
import { NodeRegistrationService, RegistrationError } from "../services/internal/nodes.service.ts";
import { logger } from "../../../logger/index.ts";

export async function postNodes(
  request: RegisteredNodeRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  try {
    const node = JSON.parse(request.body) as RegisteredNode
    NodeRegistrationService.addNode(node);
    logger.info({ nodeId: node.name, msg: "successfully registered node", })
    return reply.code(201).send();
  } catch (error) {
    if (error instanceof RegistrationError) {
      logger.error({ action: error.name, msg: error.message })
      return reply.code(418).send(error.message);
    }
    logger.error({ action: 'register node', msg: 'Unhandled error' })
    return reply.code(500).send();
  }
}
