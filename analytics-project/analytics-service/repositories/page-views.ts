import { Pool } from "pg";
import { pool } from "./pool.ts";

export interface AggregatedPageViews {
  data: Array<{ h: number; v: number }>;
}

export class PageViewsReportRepository {
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

  async getPageViews(
    pageName: string,
    // start?: { hour: number; date: Date },
    start?: string,
    order?: "ASC" | "DESC",
    take?: number,
  ): Promise<AggregatedPageViews> {
    const getUserQuery = `SELECT email, full_name, joined_at FROM users WHERE email = $1 AND deleted_at IS NULL`;
    await using session = await this.#getSession();
    // const { rows } = await session.session.query(getUserQuery, [email]);
    // return rows[0] ?? null;
    return { data: [] };
  }
}
