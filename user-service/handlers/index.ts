import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.ts";

export type GetUserRequest = FastifyRequest<{
  Params: { email: string };
}>;

export type CreateOrUpdateUserRequest = FastifyRequest<{
  Params: { email: string; fullName: string };
}>;

export async function getUserHandler(
  request: GetUserRequest,
  reply: FastifyReply,
) {
  const { email } = request.params;
  const user = await request.server.userService.getUser(email);

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send(user);
}

export async function saveOrCreateUserHandler(
  request: CreateOrUpdateUserRequest,
  reply: FastifyReply,
) {
  const { email, fullName } = request.params;
  const user = await request.server.userService;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send(user);
}

export async function userRoutes(fastify: FastifyInstance, options: object) {
  fastify.get<{ Params: { email: string } }>("/:email", getUserHandler);
}
