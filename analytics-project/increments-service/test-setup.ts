import { Pool } from "pg";
import Fastify, { type FastifyInstance } from "fastify";
import { IncrementsRepository } from "./repositories/increments.ts";
import { IncrementsService } from "./services/increments.service.ts";
import { incrementsRoutes } from "./handlers/index.ts";
import { execSync } from "child_process";

// Test database configuration
const TEST_CONNECTION_STRING =
  process.env.TEST_CONNECTION_STRING ||
  "postgresql://postgres@localhost:54321/analytics";

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
    `flyway -url=jdbc:postgresql://localhost:54321/analytics -user=postgres -password=postgres -locations=filesystem:${__dirname}/migrations migrate`,
  );

  const app = Fastify({ logger: false });

  const incrementsRepository = new IncrementsRepository(testPool);
  const incrementsService = new IncrementsService(incrementsRepository);

  app.decorate("incrementsRepository", incrementsRepository);
  app.decorate("incrementsService", incrementsService);

  await app.register(incrementsRoutes, { prefix: "/increments" });
  await app.ready();

  return { app, testPool };
}
