import type { FastifyReply, FastifyRequest } from "fastify";

export type UserRequest = FastifyRequest<{
  Params: { id: string };
}>;

export async function saveUserHandler(
  request: UserRequest,
  reply: FastifyReply,
) {
}
