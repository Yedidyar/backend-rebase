# Blob Server

## Prerequisites

- pnpm
- node v23+

## Running the project

When running for the first time:

```bash
chmod +x start-services.sh
```

Start the server with:

```bash
pnpm malic:up
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


load balancer will start on port 3000 by default.

## API Endpoints
### internal enpoints for load balancer management

```http
POST /internal/nodes
 - register a node to the load balancer
```

```http
GET /internal/nodes
 - get data of nodes registered to the load balancer
```


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
