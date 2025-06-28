import Fastify from "fastify";
import { config } from "./config.ts";
import { createLogger } from "./logger/index.ts";
import { Client } from "pg";

export const logger = createLogger("user-service");

const fastify = Fastify();

const client = new Client({
  connectionString: config.CONNECTION_STRING,
});
await client.connect();

const res = await client.query("SELECT $1::text as message", ["Hello world!"]);
console.log(res.rows[0].message); // Hello world!
await client.end();

/**
 * Run the server!
 */

const start = async () => {
  try {
    await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};
start();
