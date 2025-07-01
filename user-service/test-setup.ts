import { Pool } from "pg";
import Fastify, { type FastifyInstance } from "fastify";
import { UserRepository } from "./repositories/users.ts";
import { UserService } from "./services/user.service.ts";
import { userRoutes } from "./handlers/index.ts";
import { execSync } from "child_process";

// Test database configuration
const TEST_CONNECTION_STRING =
  process.env.TEST_CONNECTION_STRING ||
  "postgresql://postgres@localhost:54321/user_service";

export async function createTestApp(): Promise<{
  app: FastifyInstance;
  testPool: Pool;
}> {
  const testPool = new Pool({
    connectionString: TEST_CONNECTION_STRING,
    max: 5,
  });

  try {
    await testPool.query("SELECT 1");
  } catch (error) {
    throw new Error(`Cannot connect to test database: ${error}`);
  }

  execSync(
    `flyway -url=jdbc:postgresql://localhost:54321/user_service -user=postgres -password=postgres -locations=filesystem:${__dirname}/migrations migrate`,
  );

  const app = Fastify({ logger: false });

  const userRepository = new UserRepository(testPool);
  const userService = new UserService(userRepository);

  app.decorate("userRepository", userRepository);
  app.decorate("userService", userService);

  await app.register(userRoutes, { prefix: "/users" });
  await app.ready();

  return { app, testPool };
}
