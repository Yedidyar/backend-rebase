import readline from "node:readline/promises";

import { performance } from "node:perf_hooks";
import { createReadStream } from "node:fs";

function isPrime(num: number) {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

async function main() {
  const start = performance.now();

  const fileStream = createReadStream(process.argv[2], { flags: "r" });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let counter = 0;

  for await (const line of rl) {
    if (isPrime(parseInt(line))) {
      counter++;
    }
  }

  console.log(`count of prime ${counter}`);

  const end = performance.now();
  console.log(`Elapsed time: ${end - start} milliseconds`);
}

main();
