import { describe, it, expect } from "vitest";
import { pageViewsFiltersSchema, type PageViewsFilters } from "./page-views.js";

describe("pageViewsFiltersSchema", () => {
  describe("valid inputs", () => {
    it("should validate empty object", () => {
      const result = pageViewsFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should validate with take parameter", () => {
      const input = { take: 10 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate with now parameter", () => {
      const input = { now: "2024-01-01T00:00:00.000Z" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate with order parameter", () => {
      const input = { order: "ASC" as const };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate with all parameters", () => {
      const input = {
        take: 20,
        now: "2024-01-01T12:30:45.123Z",
        order: "DESC" as const,
      };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate take at minimum value", () => {
      const input = { take: 1 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate take at maximum value", () => {
      const input = { take: 24 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });
  });

  describe("invalid inputs", () => {
    it("should reject take below minimum", () => {
      const input = { take: 0 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["take"]);
        expect(result.error.issues?.[0]?.code).toBe("too_small");
      }
    });

    it("should reject take above maximum", () => {
      const input = { take: 25 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["take"]);
        expect(result.error.issues?.[0]?.code).toBe("too_big");
      }
    });

    it("should reject negative take", () => {
      const input = { take: -5 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["take"]);
        expect(result.error.issues?.[0]?.code).toBe("too_small");
      }
    });

    it("should reject invalid ISO datetime", () => {
      const input = { now: "invalid-date" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["now"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_format");
      }
    });

    it("should reject non-ISO datetime format", () => {
      const input = { now: "2024-01-01" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["now"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_format");
      }
    });

    it("should reject invalid order value", () => {
      const input = { order: "INVALID" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["order"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_value");
      }
    });

    it("should reject non-string order value", () => {
      const input = { order: 123 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["order"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_value");
      }
    });

    it("should reject non-number take value", () => {
      const input = { take: "10" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["take"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_type");
      }
    });

    it("should reject non-string now value", () => {
      const input = { now: 123 };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["now"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_type");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const input = { take: null, now: null, order: null };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });

    it("should handle undefined values", () => {
      const input = { take: undefined, now: undefined, order: undefined };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should handle empty string for now", () => {
      const input = { now: "" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["now"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_format");
      }
    });

    it("should handle case sensitivity for order", () => {
      const input = { order: "asc" };
      const result = pageViewsFiltersSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues?.[0]?.path).toEqual(["order"]);
        expect(result.error.issues?.[0]?.code).toBe("invalid_value");
      }
    });
  });

  describe("type inference", () => {
    it("should correctly infer PageViewsFilters type", () => {
      // This test ensures the type is correctly inferred
      const validFilters: PageViewsFilters = {
        take: 10,
        now: "2024-01-01T00:00:00.000Z",
        order: "ASC",
      };

      expect(validFilters.take).toBe(10);
      expect(validFilters.now).toBe("2024-01-01T00:00:00.000Z");
      expect(validFilters.order).toBe("ASC");
    });

    it("should allow partial PageViewsFilters", () => {
      const partialFilters: PageViewsFilters = {
        take: 5,
      };

      expect(partialFilters.take).toBe(5);
      expect(partialFilters.now).toBeUndefined();
      expect(partialFilters.order).toBeUndefined();
    });
  });
});
