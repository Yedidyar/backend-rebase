import { describe, it, expect } from "vitest";
import { join } from "node:path";

const TEST_FILE_PATH = join(process.cwd(), "test.txt");
const TEST_CONTENT = "Hello, this is a test file!";
const BLOB_ID = "123456789";
const SERVER_URL = "http://127.0.0.1:3000";

describe("Blob Server Integration Tests", () => {
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
  }, { timeout: 20000 }); // 10 second timeout
});
