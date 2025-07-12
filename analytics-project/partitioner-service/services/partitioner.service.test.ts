import { describe, it, expect, beforeAll, vi } from "vitest";
import { PartitionerService } from "./partitioner.service.ts";
import { createHash } from "node:crypto";

beforeAll(() => {
  vi.mock("../../logger/index.ts", () => ({
    createLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }),
  }));
  vi.mock("amqplib", () => ({
    connect: vi.fn().mockResolvedValue({
      createChannel: vi.fn().mockResolvedValue({
        assertQueue: vi.fn(),
        consume: vi.fn(),
        sendToQueue: vi.fn(),
        ack: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  }));
});

describe("PartitionerService partitioning logic", () => {
  it("hashes content and selects correct partition", () => {
    const content = JSON.stringify({ foo: "bar" });
    const hash = createHash("md5").update(content).digest("hex");
    const numPartitions = 10;
    const partition = parseInt(hash, 16) % numPartitions;
    expect(typeof partition).toBe("number");
    expect(partition).toBeGreaterThanOrEqual(0);
    expect(partition).toBeLessThan(numPartitions);
  });

  it("sends message to correct output queue", async () => {
    const service = new PartitionerService();
    // @ts-ignore
    (service as any).channel = {
      sendToQueue: vi.fn(),
      ack: vi.fn(),
    };
    const content = JSON.stringify({ foo: "bar" });
    const hash = createHash("md5").update(content).digest("hex");
    const numPartitions = 10;
    const partition = parseInt(hash, 16) % numPartitions;
    const outputQueue = `raw_views_${partition}`;
    // @ts-ignore
    await service.handleMessage({ content: Buffer.from(content) });
    expect((service as any).channel.sendToQueue).toHaveBeenCalledWith(
      outputQueue,
      Buffer.from(content),
      { persistent: true },
    );
  });
});
