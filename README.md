# Blob Server

A lightweight and efficient blob storage server built with Fastify. This server provides a simple REST API for storing, retrieving, and managing binary data (blobs).

## Features

- Store and retrieve binary data
- Automatic metadata management
- Configurable storage limits
- RESTful API endpoints
- Built with Fastify for high performance

## Prerequisites

- Docker
- docker-compose

Run the project:

```bash
pnpm run malic:up
```

Kill the project:

```bash
pnpm run malic:down
```

## Configuration

The server can be configured through the `config.ts` file. Here are the default settings:

- `BLOBS_DIR`: "storage" - Directory for storing blob data
- `METADATA_DIR`: "metadata" - Directory for storing blob metadata
- `MAX_LENGTH`: 10MB - Maximum size of a single blob
- `MAX_DISK_QUOTA`: 1GB - Maximum total storage space
- `MAX_HEADER_LENGTH`: 100 - Maximum length of a single header
- `MAX_HEADER_COUNT`: 20 - Maximum number of headers per blob
- `MAX_ID_LENGTH`: 200 - Maximum length of blob IDs
- `MAX_BLOBS_IN_FOLDER`: 1 - Maximum number of blobs per folder

## Running the Server

Start the server with:

```bash
npm start
```

The server will start on port 3000 by default.

## API Endpoints

### Store a Blob

```http
POST /blobs/:id
Content-Type: application/octet-stream

<binary data>
```

### Retrieve a Blob

```http
GET /blobs/:id
```

### Delete a Blob

```http
DELETE /blobs/:id
```

## Response Codes

- `200 OK`: Request successful
- `201 Created`: Blob successfully created
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Blob not found
- `413 Payload Too Large`: Blob exceeds size limits
- `500 Internal Server Error`: Server error

## Error Handling

The server includes comprehensive error handling and logging. All errors are logged using the built-in logger.

## Development

To run the server in development mode with hot reloading:

```bash
npm run dev
```

## License

[Add your license information here]
