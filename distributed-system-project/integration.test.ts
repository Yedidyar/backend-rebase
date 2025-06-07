import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const TEST_FILE_PATH = join(process.cwd(), "test.txt");
const TEST_CONTENT = "Hello, this is a test file!";
const BLOB_ID = "test-blob-123";
const SERVER_URL = "http://0.0.0.0:3000";

describe("Blob Server Integration Tests", () => {
  beforeAll(async () => {
    // Create test file
    await writeFile(TEST_FILE_PATH, TEST_CONTENT);
  });

  afterAll(async () => {
    // Clean up test file
    try {
      await unlink(TEST_FILE_PATH);
    } catch (error) {
      console.error("Error cleaning up test file:", error);
    }
  });

  it("should successfully POST and GET a blob", async () => {
    // POST the test file
    const postResponse = await fetch(`${SERVER_URL}/blobs/${BLOB_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(TEST_CONTENT).toString(),
      },
      body: TEST_CONTENT,
    });

    // Verify POST response
    expect(postResponse.status).toBe(201);

    // GET the blob
    const getResponse = await fetch(`${SERVER_URL}/blobs/${BLOB_ID}`);

    // Verify GET response
    expect(getResponse.status).toBe(200);
    expect(getResponse.headers.get("content-type")).toBe("text/plain");

    const receivedContent = await getResponse.text();
    expect(receivedContent).toBe(TEST_CONTENT);
  });
});
