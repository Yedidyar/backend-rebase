import readline from "node:readline/promises";

import { performance } from "node:perf_hooks";
import { Worker } from "node:worker_threads";
import { createReadStream } from "node:fs";
import { on } from "node:events";
import path from "node:path";

async function waitForResponseMessage(worker: Worker) {
  for await (const [message] of on(worker, "message")) {
    return message;
  }
}

async function processing(chunks: number[]) {
  const worker = new Worker(path.join(__dirname, "count-primes-worker.js"));
  worker.postMessage(chunks);
  const res = (await waitForResponseMessage(worker)) as Promise<number>;

  await worker.terminate();
  return res;
}

const PRIMES_PER_CHUNK = 5_000_000;

async function main() {
  const start = performance.now();

  const fileStream = createReadStream(process.argv[2], { flags: "r" });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let chunk: number[] = [];

  const promises: Promise<number>[] = [];

  for await (const line of rl) {
    chunk.push(parseInt(line));

    if (chunk.length === PRIMES_PER_CHUNK) {
      promises.push(processing(chunk));
      chunk = [];
    }
  }

  if (chunk.length !== 0) {
    promises.push(processing(chunk));
  }

  const results = await Promise.all(promises);

  const result = results.reduce((sum, curr) => sum + curr, 0);
  console.log(`count of prime ${result}`);

  const end = performance.now();
  console.log(`Elapsed time: ${end - start} milliseconds`);
}

main();
