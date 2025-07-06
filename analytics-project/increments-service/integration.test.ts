import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { type FastifyInstance } from "fastify";
import { Pool } from "pg";
import { createTestApp } from "./test-setup.ts";
import { uuidv7 } from "uuidv7";
import { logger } from "./index.ts";

vi.mock("./logger/index.ts", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: console.error,
    warn: console.warn,
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  }),
}));

describe("Increments Service API Integration Tests", () => {
  let app: FastifyInstance;
  let testPool: Pool;

  beforeAll(async () => {
    const testSetup = await createTestApp();

    app = testSetup.app;
    testPool = testSetup.testPool;
  });

  afterAll(async () => {
    await app.close();
    await testPool.end();
  });

  describe("POST /page-views/single", () => {
    it("should create a new page_views successfully", async () => {
      const incrementData = {
        page: `${uuidv7()}_altman.html`,
        timestamp: "2025-01-01T00:00:00.000Z",
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(200);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1",
        [incrementData.page],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].views_count).toBe("1");
    });

    it("should update existing page_views when creating with same page", async () => {
      const incrementData = {
        page: `${uuidv7()}_musk.html`,
        timestamp: "2025-01-01T00:00:00.000Z",
      };

      // Create page_views first
      await app.inject({
        method: "POST",
        url: "/page-views/single",
        payload: incrementData,
      });

      const response = await app.inject({
        method: "POST",
        url: "/page-views/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(200);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1",
        [incrementData.page],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].views_count).toBe("2");
    });
  });

  describe("POST /page-views/multi", () => {
    it("should create multiple page_views successfully", async () => {
      const multiIncrementData = {
        [`${uuidv7()}_altman.html`]: {
          "2025-01-01T00:00:00.000Z": 103,
          "2025-01-01T01:00:00.000Z": 200,
          "2025-01-01T02:00:00.000Z": 405,
        },
        [`${uuidv7()}_musk.html`]: {
          "2025-01-01T00:00:00.000Z": 838,
          "2025-01-01T01:00:00.000Z": 654,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      expect(response.statusCode).toBe(200);

      // Check first page entries
      const altmanPage = Object.keys(multiIncrementData)[0];
      const altmanResult = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1 ORDER BY hour",
        [altmanPage],
      );

      expect(altmanResult.rows.length).toBe(3);
      expect(altmanResult.rows[0].views_count).toBe("103");
      expect(altmanResult.rows[0].hour).toBe(0);
      expect(altmanResult.rows[1].views_count).toBe("200");
      expect(altmanResult.rows[1].hour).toBe(1);
      expect(altmanResult.rows[2].views_count).toBe("405");
      expect(altmanResult.rows[2].hour).toBe(2);

      // Check second page entries
      const muskPage = Object.keys(multiIncrementData)[1];
      const muskResult = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1 ORDER BY hour",
        [muskPage],
      );

      expect(muskResult.rows.length).toBe(2);
      expect(muskResult.rows[0].views_count).toBe("838");
      expect(muskResult.rows[0].hour).toBe(0);
      expect(muskResult.rows[1].views_count).toBe("654");
      expect(muskResult.rows[1].hour).toBe(1);
    });

    it("should update existing page_views when creating with same page and time", async () => {
      const pageName = `${uuidv7()}_test.html`;
      const multiIncrementData = {
        [pageName]: {
          "2025-01-01T00:00:00.000Z": 100,
        },
      };

      // Create initial entry
      await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      // Update with additional views
      const updateData = {
        [pageName]: {
          "2025-01-01T00:00:00.000Z": 50,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1",
        [pageName],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].views_count).toBe("150"); // 100 + 50
    });

    it("should handle invalid time format", async () => {
      const multiIncrementData = {
        "test.html": {
          "invalid-time-format": 100,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      expect(response.statusCode).toBe(500);
    });

    it("should aggregate multiple entries for same page, date, and hour within single request", async () => {
      const pageName = `${uuidv7()}_aggregation_test.html`;

      // Create data with multiple timestamps that resolve to the same hour
      const multiIncrementData = {
        [pageName]: {
          "2025-01-01T00:15:00.000Z": 100, // Hour 0
          "2025-01-01T00:30:00.000Z": 200, // Hour 0 (same hour as above)
          "2025-01-01T00:45:00.000Z": 300, // Hour 0 (same hour as above)
          "2025-01-01T01:00:00.000Z": 150, // Hour 1
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      expect(response.statusCode).toBe(200);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1 ORDER BY hour",
        [pageName],
      );

      // Should have 2 entries: one for hour 0 and one for hour 1
      expect(result.rows.length).toBe(2);

      // Hour 0 should have aggregated value: 100 + 200 + 300 = 600
      expect(result.rows[0].hour).toBe(0);
      expect(result.rows[0].views_count).toBe("600");

      // Hour 1 should have the single value: 150
      expect(result.rows[1].hour).toBe(1);
      expect(result.rows[1].views_count).toBe("150");
    });
  });
});
