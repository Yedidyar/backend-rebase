import { describe, it, expect } from "vitest";
import { HashMap } from "./hash-map";

// tests are AI generated they are for me :)

describe("HashMap", () => {
  it("should put and get values", () => {
    const map = new HashMap<number>();
    map.put("a", 1);
    map.put("b", 2);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
  });

  it("should overwrite values with the same key", () => {
    const map = new HashMap<number>();
    map.put("a", 1);
    map.put("a", 42);
    expect(map.get("a")).toBe(42);
  });

  it("should throw on get for non-existing key", () => {
    const map = new HashMap<number>();
    expect(() => map.get("nope")).toThrow("non existing key");
  });

  it("should remove values", () => {
    const map = new HashMap<number>();
    map.put("a", 1);
    map.remove("a");
    expect(() => map.get("a")).toThrow("non existing key");
  });

  it("should handle collisions", () => {
    // These two keys are likely to collide in a small hash table
    const map = new HashMap<number>(1);
    map.put("a", 1);
    map.put("b", 2);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBe(2);
  });

  it("should work with different value types", () => {
    const map = new HashMap<{ x: number }>();
    map.put("obj", { x: 5 });
    expect(map.get("obj")).toEqual({ x: 5 });
  });

  it("should allow multiple removes and puts", () => {
    const map = new HashMap<number>();
    map.put("a", 1);
    map.put("b", 2);
    map.remove("a");
    map.put("a", 3);
    expect(map.get("a")).toBe(3);
    expect(map.get("b")).toBe(2);
  });

  it("should not affect other keys when removing", () => {
    const map = new HashMap<number>();
    map.put("a", 1);
    map.put("b", 2);
    map.remove("a");
    expect(map.get("b")).toBe(2);
  });

  it("should handle empty string as a key", () => {
    const map = new HashMap<number>();
    map.put("", 123);
    expect(map.get("")).toBe(123);
    map.remove("");
    expect(() => map.get("")).toThrow("non existing key");
  });
});
