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
  start?: string,
  order: "ASC" | "DESC" = "ASC",
  take?: number
): Promise<AggregatedPageViews> {
  const date = start
    ? new Date(start).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const query =
    take && take >= 1 && take <= 24
      ? `SELECT hour as h, views_count as v FROM page_views_report WHERE page_name = $1 AND date = $2 ORDER BY hour ${order} LIMIT $3`
      : `SELECT hour as h, views_count as v FROM page_views_report WHERE page_name = $1 AND date = $2 ORDER BY hour ${order}`;

  const params =
    take && take >= 1 && take <= 24
      ? [pageName, date, take]
      : [pageName, date];

  await using sessionWrapper = await this.#getSession();
  const { rows } = await sessionWrapper.session.query(query, params);

  return {
    data: rows.map((row) => ({ h: +row.h, v: +row.v })),
  };
}





}
