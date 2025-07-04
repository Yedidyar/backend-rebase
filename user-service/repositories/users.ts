import { Pool } from "pg";
import { logger } from "../index.ts";
import { pool } from "./pool.ts";

export interface UserDto {
  id: string;
  email: string;
  full_name: string;
  joined_at: Date;
  deleted_at?: Date | null;
}

export const upsertUserAction = "UPSERT USER";

export class UserRepository {
  #pool: Pool;
  constructor(injectedPool?: Pool) {
    this.#pool = injectedPool ?? pool;
  }

  async #getSession() {
    const session = await this.#pool.connect();
    return {
      session,
      [Symbol.asyncDispose]: async () => {
        session.release();
      },
    };
  }

  async upsert(user: UserDto) {
    const upsertQuery = `
        INSERT INTO users (id, email, full_name, joined_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) 
        DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          deleted_at = EXCLUDED.deleted_at
        WHERE users.email = EXCLUDED.email
        RETURNING id, email, full_name, joined_at, 
            (users.deleted_at is NULL) as already_exists, 
            (xmax = 0) as is_insert;
      `;
    await using session = await this.#getSession();
    const { rows } = await session.session.query(upsertQuery, [
      user.id,
      user.email,
      user.full_name,
      user.joined_at,
      null,
    ]);

    const { id, full_name, email, joined_at, already_exists, is_insert } =
      rows[0];

    if (is_insert) {
      logger.info({
        action: upsertUserAction,
        userId: id,
        message: "new user was created",
      });
    } else if (already_exists) {
      logger.info({
        action: upsertUserAction,
        userId: id,
        message: "user is already active",
      });
    } else {
      logger.info({
        action: upsertUserAction,
        userId: id,
        message: "user was reactivated",
      });
    }
    return { full_name, email, joined_at };
  }

  async getUser(email: string): Promise<UserDto | null> {
    const getUserQuery = `SELECT email, full_name, joined_at FROM users WHERE email = $1 AND deleted_at IS NULL`;
    await using session = await this.#getSession();
    const { rows } = await session.session.query(getUserQuery, [email]);
    return rows[0] ?? null;
  }

  async delete(email: string): Promise<void> {
    const action = "SOFT DELETE USER";
    const deleteQuery = `UPDATE users SET deleted_at = NOW() WHERE email = $1 AND deleted_at IS NULL`;

    await using session = await this.#getSession();
    const { rowCount } = await session.session.query(deleteQuery, [email]);

    if (rowCount && rowCount > 0) {
      logger.info({ action, email, message: "The user was soft-deleted" });
    } else {
      logger.info({
        action,
        email,
        message: "The user doesn't exist or is currently inactive",
      });
    }
  }
}
