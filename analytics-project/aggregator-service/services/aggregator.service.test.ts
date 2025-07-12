import { describe, it, expect, beforeAll, vi } from "vitest";
import { AggregatorService, type PageViewBatch } from "./aggregator.service.ts";

// Mock the logger to avoid side effects
beforeAll(() => {
  vi.mock("../index.ts", () => ({
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }));
});

function getService() {
  return new AggregatorService();
}

describe("AggregatorService.aggregatePageViewBatches", () => {
  it("aggregates a single batch with one page and one timestamp", () => {
    const batch: PageViewBatch = {
      "/home": { "2024-01-01T10:00:00Z": 3 },
    };
    const result = getService().aggregatePageViewBatches([batch]);
    expect(result).toEqual([
      { page: "/home", count: 3, timestamp: "2024-01-01T10:00:00.000Z" },
    ]);
  });

  it("aggregates a single batch with one page and multiple timestamps", () => {
    const batch: PageViewBatch = {
      "/home": {
        "2024-01-01T10:00:00Z": 3,
        "2024-01-01T10:01:00Z": 2,
      },
    };
    const result = getService().aggregatePageViewBatches([batch]);
    expect(result).toEqual([
      { page: "/home", count: 5, timestamp: "2024-01-01T10:01:00.000Z" },
    ]);
  });

  it("aggregates a single batch with multiple pages", () => {
    const batch: PageViewBatch = {
      "/home": { "2024-01-01T10:00:00Z": 3 },
      "/about": { "2024-01-01T10:02:00Z": 1 },
    };
    const result = getService().aggregatePageViewBatches([batch]);
    expect(result).toEqual([
      { page: "/home", count: 3, timestamp: "2024-01-01T10:02:00.000Z" },
      { page: "/about", count: 1, timestamp: "2024-01-01T10:02:00.000Z" },
    ]);
  });

  it("aggregates multiple batches and sums counts", () => {
    const batch1: PageViewBatch = {
      "/home": { "2024-01-01T10:00:00Z": 3 },
    };
    const batch2: PageViewBatch = {
      "/home": { "2024-01-01T10:01:00Z": 2 },
      "/about": { "2024-01-01T10:02:00Z": 1 },
    };
    const result = getService().aggregatePageViewBatches([batch1, batch2]);
    expect(result).toEqual([
      { page: "/home", count: 5, timestamp: "2024-01-01T10:02:00.000Z" },
      { page: "/about", count: 1, timestamp: "2024-01-01T10:02:00.000Z" },
    ]);
  });

  it("handles empty input", () => {
    const result = getService().aggregatePageViewBatches([]);
    expect(result).toEqual([]);
  });

  it("handles invalid timestamps gracefully", () => {
    const batch: PageViewBatch = {
      "/home": { "not-a-date": 3 },
    };
    const result = getService().aggregatePageViewBatches([batch]);
    expect(result[0]?.page).toBe("/home");
    expect(result[0]?.count).toBe(3);
    expect(typeof result[0]?.timestamp).toBe("string"); // Should fallback to now
  });
});
