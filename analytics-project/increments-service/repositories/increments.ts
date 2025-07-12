import { Pool, type PoolClient } from "pg";
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

  async #executeIncrementQuery(
    session: PoolClient,
    page: string,
    date: Date,
    hour: number,
    value: number,
  ) {
    return await session.query(
      `INSERT INTO page_views (id, name, date, hour, views_count) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name, date, hour) 
       DO UPDATE SET views_count = page_views.views_count + $5`,
      [uuidv7(), page, date, hour, value],
    );
  }

  async incrementPage(page: string, date: Date, hour: number, value: number) {
    await using sessionResource = await this.#getSession();
    const { session } = sessionResource;

    try {
      const result = await this.#executeIncrementQuery(
        session,
        page,
        date,
        hour,
        value,
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

  async incrementMultiplePages(
    pageIncrements: Array<{
      page: string;
      date: Date;
      hour: number;
      value: number;
    }>,
  ) {
    if (pageIncrements.length === 0) {
      return {
        successful: [],
        failed: [],
        totalProcessed: 0,
        successCount: 0,
        errorCount: 0,
      };
    }

    await using sessionResource = await this.#getSession();
    const { session } = sessionResource;

    try {
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const increment of pageIncrements) {
        values.push(
          uuidv7(),
          increment.page,
          increment.date,
          increment.hour,
          increment.value,
        );
        placeholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`,
        );
        paramIndex += 5;
      }

      const sql = `
        INSERT INTO page_views (id, name, date, hour, views_count) 
        VALUES ${placeholders.join(", ")}
        ON CONFLICT (name, date, hour) 
        DO UPDATE SET views_count = page_views.views_count + EXCLUDED.views_count
      `;

      await session.query(sql, values);

      const successfulResults = pageIncrements.map((increment) => ({
        page: increment.page,
        date: increment.date,
        hour: increment.hour,
        success: true,
      }));

      return {
        successful: successfulResults,
        failed: [],
        totalProcessed: pageIncrements.length,
        successCount: pageIncrements.length,
        errorCount: 0,
      };
    } catch (err) {
      logger.error({
        action: "INCREMENT MULTIPLE PAGES",
        message: "Failed to increment pages in batch",
        cause: { count: pageIncrements.length, error: err },
      });

      // Fallback to individual processing if batch fails
      return await this.#incrementPagesIndividually(pageIncrements);
    }
  }

  async #incrementPagesIndividually(
    pageIncrements: Array<{
      page: string;
      date: Date;
      hour: number;
      value: number;
    }>,
  ) {
    await using sessionResource = await this.#getSession();
    const { session } = sessionResource;

    const results = [];
    const errors = [];

    for (const increment of pageIncrements) {
      try {
        const result = await this.#executeIncrementQuery(
          session,
          increment.page,
          increment.date,
          increment.hour,
          increment.value,
        );
        results.push({
          page: increment.page,
          date: increment.date,
          hour: increment.hour,
          success: true,
        });
      } catch (err) {
        errors.push({
          page: increment.page,
          date: increment.date,
          hour: increment.hour,
          error: err,
        });
        logger.warn({
          action: "INCREMENT MULTIPLE PAGES",
          message: "Failed to increment page",
          cause: {
            page: increment.page,
            date: increment.date,
            hour: increment.hour,
            error: err,
          },
        });
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: pageIncrements.length,
      successCount: results.length,
      errorCount: errors.length,
    };
  }
}
