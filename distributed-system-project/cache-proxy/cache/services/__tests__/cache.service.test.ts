import { LRUCacheService } from "../cache.service.ts";
import { describe, it, expect, beforeEach } from "vitest";

describe("LRUCacheService", () => {
  let cache: LRUCacheService;
  const CAPACITY = 3;

  beforeEach(() => {
    cache = new LRUCacheService(CAPACITY);
  });

  describe("put", () => {
    it("should add items to the cache", () => {
      const id = "test1";
      const value = new ArrayBuffer(8);
      cache.put(id, value);

      const result = cache.tryGet(id);
      expect(result).not.toBeNull();
      expect(result?.value[1]).toBe(value);
    });

    it("should evict least recently used item when capacity is reached", () => {
      // Fill cache to capacity
      cache.put("key1", new ArrayBuffer(8));
      console.log({
        head: cache.linkedList.getHead(),
        tail: cache.linkedList.getTail(),
        value: "key1",
      }
      );

      cache.put("key2", new ArrayBuffer(8));
      console.log({
        head: cache.linkedList.getHead(),
        tail: cache.linkedList.getTail(),
        value: "key2",
      }
      );

      cache.put("key3", new ArrayBuffer(8));

      // console.log({
      //   head: cache.linkedList.getHead(),
      //   tail: cache.linkedList.getTail(),
      //   value: "key3",
      // }
      // );

      // // Add one more item
      cache.put("key4", new ArrayBuffer(8));

      // console.log({
      //   head: cache.linkedList.getHead(),
      //   tail: cache.linkedList.getTail(),
      //   value: "key4",
      // })

      // key1 should be evicted as it was the least recently used
      expect(cache.tryGet("key1")).toBeNull();
      expect(cache.tryGet("key2")).not.toBeNull();
      expect(cache.tryGet("key3")).not.toBeNull();
      expect(cache.tryGet("key4")).not.toBeNull();
    });
  });

  describe("tryGet", () => {
    it("should return null for non-existent key", () => {
      expect(cache.tryGet("nonexistent")).toBeNull();
    });

    it("should move accessed item to most recently used position", () => {
      cache.put("key1", new ArrayBuffer(8));
      cache.put("key2", new ArrayBuffer(8));
      cache.put("key3", new ArrayBuffer(8));

      // Access key1
      cache.tryGet("key1");

      // Add new item, should evict key2 (not key1)
      cache.put("key4", new ArrayBuffer(8));

      expect(cache.tryGet("key1")).not.toBeNull();
      expect(cache.tryGet("key2")).toBeNull();
    });
  });

  describe("remove", () => {
    it("should remove item from cache", () => {
      cache.put("key1", new ArrayBuffer(8));
      cache.remove("key1");
      expect(cache.tryGet("key1")).toBeNull();
    });

    it("should do nothing when removing non-existent key", () => {
      expect(() => cache.remove("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should remove all items from cache", () => {
      cache.put("key1", new ArrayBuffer(8));
      cache.put("key2", new ArrayBuffer(8));

      cache.clear();

      expect(cache.tryGet("key1")).toBeNull();
      expect(cache.tryGet("key2")).toBeNull();
    });
  });

  describe("LRU behavior", () => {
    it("should maintain correct order of recently used items", () => {
      cache.put("key1", new ArrayBuffer(8));
      cache.put("key2", new ArrayBuffer(8));
      cache.put("key3", new ArrayBuffer(8));

      // Access key1, making key2 the least recently used
      cache.tryGet("key1");

      // Add new item, should evict key2
      cache.put("key4", new ArrayBuffer(8));

      expect(cache.tryGet("key1")).not.toBeNull();
      expect(cache.tryGet("key2")).toBeNull();
      expect(cache.tryGet("key3")).not.toBeNull();
      expect(cache.tryGet("key4")).not.toBeNull();
    });
  });
});
