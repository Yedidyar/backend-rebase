import { Pool } from "pg";
import { pool } from "./pool.ts";
import { logger } from "../index.ts";
import { uuidv7 } from "uuidv7";

export class IncrementsRepository {
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

  async incrementPage(page: string, date: Date, hour: number, value: number) {
    await using sessionResource = await this.#getSession();
    const { session } = sessionResource;

    try {
      const result = await session.query(
        `INSERT INTO page_views (id, name, date, hour, views_count) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name, date, hour) 
         DO UPDATE SET views_count = page_views.views_count + $5`,
        [uuidv7(), page, date, hour, value],
      );

      if (result.rowCount === 0) {
        logger.warn({
          action: "INCREMENT PAGE",
          message: "Page not found",
          cause: { page, date, hour },
        });

        return null;
      }
    } catch (err) {
      throw new Error("Couldn't increment page", { cause: err });
    }
  }
}
