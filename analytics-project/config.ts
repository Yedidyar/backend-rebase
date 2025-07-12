export const config = {
  PORT: parseInt(process.env.PORT!),
  CONNECTION_STRING: process.env.CONNECTION_STRING!,
  // Aggregator specific config
  AGGREGATOR_ID: process.env.AGGREGATOR_ID || "0",
  INPUT_QUEUE: process.env.INPUT_QUEUE || "raw_views_0",
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || "1000"),
  BATCH_TIMEOUT_MS: parseInt(process.env.BATCH_TIMEOUT_MS || "60000"),
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
  INCREMENTS_SERVICE_URL:
    process.env.INCREMENTS_SERVICE_URL || "http://localhost:3001",
} as const;
