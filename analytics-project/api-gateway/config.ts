export const config = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
  INPUT_QUEUE: process.env.INPUT_QUEUE || "raw_views",
  OUTPUT_QUEUE_PREFIX: process.env.OUTPUT_QUEUE_PREFIX || "raw_views_",
  NUM_PARTITIONS: parseInt(process.env.NUM_PARTITIONS || "10"),
} as const;
