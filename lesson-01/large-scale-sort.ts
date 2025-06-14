import fs from "node:fs";
import readline from "node:readline/promises";
import { Heap } from "heap-js";
import { createHash } from "node:crypto";

async function createSortedChunks(
  linesPerChunk = 100_000,
  inputPath = "input.txt",
) {
  const fileStream = fs.createReadStream(inputPath);

  const rl = readline.createInterface({
    input: fileStream,
  });

  let count = 0;
  let chunk: string[] = [];
  for await (let element of rl) {
    chunk.push(element);

    if (chunk.length === linesPerChunk) {
      writeSortedChunkToFile(chunk, count);

      chunk = [];
      count++;
    }
  }

  if (chunk.length !== 0) {
    writeSortedChunkToFile(chunk, count);
  }
}

function writeSortedChunkToFile(chunk: string[], count: number) {
  chunk.sort();

  const writer = fs.createWriteStream(`chunk_${count}`);
  for (const line of chunk) {
    writer.write(`${line}\r\n`, (e) => {
      if (e) {
        console.log(e);
      }
    });
  }
}

async function* readLines(filePath: string) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    yield line;
  }
}

async function getAllFiles() {
  const files = fs.readdirSync(".").filter((fn) => fn.startsWith("chunk_"));
  files.sort((a, b) => a.localeCompare(b));

  return files.map((file) => {
    return readLines(file);
  });
}

async function main() {
  await createSortedChunks();
  const files = await getAllFiles();

  const heap = new Heap<{
    fileIterator: AsyncGenerator<string, void, unknown>;
    value: string;
  }>((a, b) => a.value.localeCompare(b.value));

  for (const file of files) {
    const value = await file.next();
    if (value.done) {
      continue;
    }

    heap.push({
      fileIterator: file,
      value: value.value,
    });
  }
  const writer = fs.createWriteStream("./output.txt");

  let count = 0;
  while (count !== heap.length) {
    let minValue = heap.pop();
    const next = await minValue?.fileIterator.next();

    if (next?.done || next?.value === undefined || !minValue?.fileIterator) {
      continue;
    }

    heap.push({
      fileIterator: minValue.fileIterator,
      value: next.value,
    });

    writer.write(`${minValue.value}\n`);
  }
}
main();
