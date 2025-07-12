# Aggregator Service

The Aggregator Service is a TypeScript/Fastify service that processes page view messages from RabbitMQ queues and aggregates them before sending to the increments service.

## Architecture

The aggregator service is part of the analytics pipeline:

1. **Input**: Consumes messages from a RabbitMQ queue (e.g., `raw_views_0`)
2. **Batching**: Collects messages in batches (1000 messages or 1 minute timeout)
3. **Aggregation**: Groups page views by page and counts them
4. **Output**: Sends aggregated data to the increments service via HTTP

## Features

- **Batch Processing**: Processes up to 1000 messages or waits 1 minute (configurable)
- **Page Aggregation**: Groups page views by page and counts occurrences
- **Graceful Shutdown**: Handles SIGTERM and SIGINT signals properly
- **Error Handling**: Acknowledges messages and handles errors gracefully
- **Logging**: Comprehensive logging with Winston

## Configuration

Environment variables:

- `AGGREGATOR_ID`: Unique identifier for this aggregator instance (default: "0")
- `INPUT_QUEUE`: RabbitMQ queue to consume from (default: "raw_views_0")
- `BATCH_SIZE`: Maximum messages per batch (default: 1000)
- `BATCH_TIMEOUT_MS`: Timeout in milliseconds (default: 60000)
- `RABBITMQ_URL`: RabbitMQ connection URL (default: "amqp://admin:admin@localhost:5672")
- `INCREMENTS_SERVICE_URL`: URL of the increments service (default: "http://localhost:3001")

## Message Format

### Input (from RabbitMQ)

The aggregator now expects messages in the following schema:

```json
{
  "/home": {
    "2024-01-01T10:00:00Z": 3,
    "2024-01-01T10:01:00Z": 2
  },
  "/about": {
    "2024-01-01T10:02:00Z": 1
  }
}
```

- Each key is a page name (e.g., "/home").
- Each value is an object mapping timestamps to counts for that page.

### Output (to increments service)

```json
[
  {
    "page": "/home",
    "count": 5,
    "timestamp": "2024-01-01T10:01:00Z"
  },
  {
    "page": "/about",
    "count": 1,
    "timestamp": "2024-01-01T10:02:00Z"
  }
]
```

- Each output object contains the page, the total count for that page (summed across all timestamps in the batch), and the latest timestamp seen in the batch (or the current time if none found).

## Usage

### Development

```bash
pnpm aggregator:dev
```

### Production

```bash
pnpm aggregator:prod
```

### Docker

The service is configured in `docker-compose.yml` with multiple instances (aggregator-0 through aggregator-9).

## Dependencies

- **Fastify**: Web framework
- **amqplib**: RabbitMQ client
- **Winston**: Logging
- **TypeScript**: Type safety

## Error Handling

- Invalid messages are logged and acknowledged to prevent infinite loops
- Network errors are logged and retried
- Graceful shutdown ensures no message loss
