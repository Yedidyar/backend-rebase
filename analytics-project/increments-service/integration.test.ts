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

  describe("POST /increments/single", () => {
    it("should create a new page_views successfully", async () => {
      const incrementData = {
        page: `${uuidv7()}_altman.html`,
        timestamp: "2025-01-01T00:00:00.000Z",
      };

      const response = await app.inject({
        method: "POST",
        url: "/increments/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(201);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1",
        [incrementData.page],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].views_count).toBe(1);
    });

    it("should update existing page_views when creating with same page", async () => {
      const incrementData = {
        page: `${uuidv7()}_musk.html`,
        timestamp: "2025-01-01T00:00:00.000Z",
      };

      // Create page_views first
      await app.inject({
        method: "POST",
        url: "/increments/single",
        payload: incrementData,
      });

      const response = await app.inject({
        method: "POST",
        url: "/increments/single",
        payload: incrementData,
      });

      expect(response.statusCode).toBe(201);

      const result = await testPool.query(
        "SELECT * FROM page_views WHERE name = $1",
        [incrementData.page],
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].views_count).toBe(2);
    });
  });
});
