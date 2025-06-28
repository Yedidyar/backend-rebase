import Fastify from "fastify";
import { config } from "./config.ts";
import { createLogger } from "./logger/index.ts";
import { Pool } from "pg";

export const logger = createLogger("user-service");

const fastify = Fastify();

export interface UserDto {
  id: string;
  email: string;
  full_name: string;
  joined_at: Date;
  deleted_since?: Date | null;
}

export class UserRepository {
  #pool: Pool;
  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async #getSession() {
    const session = await this.#pool.connect();
    session.connect();
    return {
      session,
      [Symbol.asyncDispose]: async () => {
        session.release();
      },
    };
  }

  async upsert(user: UserDto): Promise<UserDto> {
    const upsertQuery = `
      INSERT INTO users (id, email, full_name, joined_at, deleted_since)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) 
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        joined_at = EXCLUDED.joined_at,
        deleted_since = EXCLUDED.deleted_since
      RETURNING *;
    `;

    await using session = await this.#getSession();

    const result = await session.session.query(upsertQuery, [
      user.id,
      user.email,
      user.full_name,
      user.joined_at,
      user.deleted_since || null,
    ]);

    return result.rows[0] as UserDto;
  }
}

/**
 * Run the server!
 */

const start = async () => {
  try {
    const pool = new Pool({
      connectionString: config.CONNECTION_STRING,
    });

    const userRepository = new UserRepository(pool);

    fastify.decorate("userRepository", userRepository);

    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
    logger.info(`Server listening on port ${config.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
