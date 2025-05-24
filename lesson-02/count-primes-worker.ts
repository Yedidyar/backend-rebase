import { parentPort } from "node:worker_threads";

function isPrime(num: number) {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

function countPrimes(numbers: number[]) {
  let count = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (isPrime(numbers[i]!)) {
      count++;
    }
  }

  return count;
}

parentPort?.on("message", async (chunk) => {
  parentPort?.postMessage(countPrimes(chunk));
});
