import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";

export type UserRequest = FastifyRequest<{
  Params: { email: string };
}>;

export async function getUserHandler(
  request: UserRequest,
  reply: FastifyReply,
) {
  const { email } = request.params;
  const user = await request.server.userRepository.getUser(email);

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send(user);
}

export async function userRoutes(fastify: FastifyInstance, options: object) {
  fastify.get<{ Params: { email: string } }>("/:email", getUserHandler);
}
