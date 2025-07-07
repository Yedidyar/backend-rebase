import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { type FastifyInstance } from "fastify";
import { Pool } from "pg";
import { createTestApp } from "./test-setup.ts";
import { uuidv7 } from "uuidv7";

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
      expect(result.rows[0]).toMatchObject({
        name: incrementData.page,
        views_count: "1",
      });
    });

    it("should update existing page_views when creating with same page", async () => {
      const incrementData = {
        page: `${uuidv7()}_musk.html`,
        timestamp: "2025-01-01T00:00:00.000Z",
      };

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
      expect(result.rows[0]).toMatchObject({
        name: incrementData.page,
        views_count: "2",
      });
    });

    it("should handle invalid timestamp format", async () => {
      const incrementData = {
        page: "test.html",
        timestamp: "invalid-timestamp",
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        error: "Bad Request",
      });
      expect(responseBody.message).toContain("date-time");
    });

    it("should handle empty page identifier", async () => {
      const incrementData = {
        page: "",
        timestamp: "2025-01-01T00:00:00.000Z",
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        error: "Bad Request",
      });
      expect(responseBody.message).toContain(
        "must NOT have fewer than 1 characters",
      );
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

      const altmanPage = Object.keys(multiIncrementData)[0];
      const altmanResult = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1 ORDER BY hour",
        [altmanPage],
      );

      expect(altmanResult.rows).toStrictEqual([
        expect.objectContaining({
          name: altmanPage,
          views_count: "103",
          hour: 0,
        }),
        expect.objectContaining({
          name: altmanPage,
          views_count: "200",
          hour: 1,
        }),
        expect.objectContaining({
          name: altmanPage,
          views_count: "405",
          hour: 2,
        }),
      ]);

      const muskPage = Object.keys(multiIncrementData)[1];
      const muskResult = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1 ORDER BY hour",
        [muskPage],
      );

      expect(muskResult.rows).toStrictEqual([
        expect.objectContaining({
          name: muskPage,
          views_count: "838",
          hour: 0,
        }),
        expect.objectContaining({
          name: muskPage,
          views_count: "654",
          hour: 1,
        }),
      ]);
    });

    it("should update existing page_views when creating with same page and time", async () => {
      const pageName = `${uuidv7()}_test.html`;
      const multiIncrementData = {
        [pageName]: {
          "2025-01-01T00:00:00.000Z": 100,
        },
      };

      await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

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

      expect(result.rows[0]).toMatchObject({
        name: pageName,
        views_count: "150",
      });
    });

    it("should handle invalid timestamp format", async () => {
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

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        error: "Invalid input data",
        details: expect.stringContaining("invalid-time-format"),
      });
    });

    it("should handle empty request body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toStrictEqual({
        error: "Request body cannot be empty",
      });
    });

    it("should handle invalid page identifier", async () => {
      const multiIncrementData = {
        "": {
          "2025-01-01T00:00:00.000Z": 100,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toStrictEqual({
        error: "Request body cannot be empty",
      });
    });

    it("should handle negative increment values", async () => {
      const multiIncrementData = {
        "test.html": {
          "2025-01-01T00:00:00.000Z": -5,
        },
      };

      const response = await app.inject({
        method: "POST",
        url: "/page-views/multi",
        payload: multiIncrementData,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        error: "Bad Request",
      });
      expect(responseBody.message).toContain("must be >= 0");
    });

    it("should aggregate multiple entries for same page, date, and hour within single request", async () => {
      const pageName = `${uuidv7()}_aggregation_test.html`;

      const multiIncrementData = {
        [pageName]: {
          "2025-01-01T00:15:00.000Z": 100,
          "2025-01-01T00:30:00.000Z": 200,
          "2025-01-01T00:45:00.000Z": 300,
          "2025-01-01T01:00:00.000Z": 150,
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

      expect(result.rows).toStrictEqual([
        expect.objectContaining({
          name: pageName,
          hour: 0,
          views_count: "600",
        }),
        expect.objectContaining({
          name: pageName,
          hour: 1,
          views_count: "150",
        }),
      ]);
    });
  });
});
