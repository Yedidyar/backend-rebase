import Fastify from "fastify";
import { config } from "./config.ts";
import { createLogger } from "./logger/index.ts";
import { UserRepository } from "./repositories/users.ts";
import { userRoutes } from "./handlers/index.ts";
import { UserService } from "./services/user.service.ts";

export const logger = createLogger("user-service");

const fastify = Fastify();

declare module "fastify" {
  interface FastifyInstance {
    userRepository: UserRepository;
    userService: UserService;
  }
}

/**
 * Run the server!
 */

const start = async () => {
  try {
    fastify.decorate("userRepository", new UserRepository());
    fastify.decorate("userService", new UserService(fastify.userRepository));

    await fastify.register(userRoutes, { prefix: "/users" });

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
