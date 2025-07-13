export const config = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672",
  OUTPUT_QUEUE_PREFIX: process.env.OUTPUT_QUEUE_PREFIX || "page_views_",
  NUM_PARTITIONS: parseInt(process.env.NUM_PARTITIONS || "10"),
  ANALYTICS_HOST: process.env.ANALYTICS_HOST || "localhost",
  ANALYTICS_PORT: parseInt(process.env.ANALYTICS_PORT || "5002"),
  PORT: parseInt(process.env.PORT || "4283"),
} as const;
