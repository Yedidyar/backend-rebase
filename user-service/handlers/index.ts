import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { logger } from "../index.ts";
import { upsertUserAction } from "../repositories/users.ts";
import { UpsertError } from "../services/user.service.ts";

export type GetUserRequest = FastifyRequest<{
  Params: { email: string };
}>;

export type CreateOrUpdateUserRequest = FastifyRequest<{
  Body: { email: string; fullName: string };
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
  try {
    const { email, fullName } = request.body;
    const user = await request.server.userService.createOrUpdateUser(
      email,
      fullName,
    );
    return reply.status(201).send(user);
  } catch (err) {
    if (err instanceof UpsertError) {
      logger.error({
        action: upsertUserAction,
        message: `Couldn't save user: ${err.message}`,
        cause: (err as Error)?.cause,
      });
    } else {
      logger.error({
        action: upsertUserAction,
        message: (err as Error)?.message,
        cause: (err as Error)?.cause,
      });
    }
    return reply.status(500).send("Couldn't save user");
  }
}

export async function userRoutes(fastify: FastifyInstance, options: object) {
  fastify.get<{ Params: { email: string } }>("/:email", getUserHandler);
  fastify.post<{ Body: { email: string; fullName: string } }>(
    "/",
    saveOrCreateUserHandler,
  );
}
