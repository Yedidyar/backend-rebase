# User Service

A Fastify-based REST API service for managing user data with PostgreSQL database integration.

## Features

- User creation and updates with email-based identification
- Soft delete support (users can be reactivated)
- PostgreSQL database integration with connection pooling
- Structured logging with Winston and Logzio integration
- TypeScript with full type safety
- Docker support for PostgreSQL
- **Database migrations using Flyway**

## Prerequisites

- Node.js v18+
- pnpm (recommended) or npm
- PostgreSQL 16+
- Docker (optional, for running PostgreSQL)
- **Flyway CLI** (for database migrations)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
CONNECTION_STRING=postgresql://postgres@localhost:54321/user_service
LOGZIO_TOKEN=your_logzio_token_here
LISTENER_URL=your_logzio_listener_url
```

## Database Setup

1. Start PostgreSQL using Docker Compose:

```bash
docker-compose -f docker-compose.postgres.yml up -d
```

2. **Run Flyway migrations:**

```bash
# Navigate to the user-service directory
cd user-service

# Run migrations using Flyway CLI
flyway -configFiles=flyway.conf migrate
```

## Flyway Configuration

The service includes a `flyway.conf` file with the following configuration:

```properties
flyway.url=jdbc:postgresql://localhost:54321/user_service
flyway.user=postgres
flyway.locations=filesystem:./migrations
flyway.baselineVersion=1
flyway.password=
```

**Important:** Before running the service, you **must** run the Flyway migrations first to create the database schema.

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. **Run database migrations first:**

```bash
cd user-service
flyway -configFiles=flyway.conf migrate
```

3. Start the development server:

```bash
pnpm run user-service:dev
```

4. For production:

```bash
pnpm run user-service:prod
```

## API Endpoints

### Get User

```http
GET /users/:email
```

**Response:**

- `200 OK` - User found
  ```json
  {
    "email": "user@example.com",
    "full_name": "John Doe",
    "joined_at": "2024-01-01T00:00:00.000Z"
  }
  ```
- `404 Not Found` - User not found

### Create or Update User

```http
POST /users
```

**URL Parameters:**

- `email` - User's email address
- `fullName` - User's full name

**Response:**

- `201 Created` - User created/updated successfully
  ```json
  {
    "full_name": "John Doe",
    "email": "user@example.com",
    "joined_at": "2024-01-01T00:00:00.000Z"
  }
  ```
- `500 Internal Server Error` - Database error

## Database Schema

The service uses a single `users` table with the following structure:

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  joined_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);
```

### Key Features:

- **Soft Delete**: Users are not physically deleted, but marked with `deleted_at` timestamp
- **Email Uniqueness**: Email addresses are unique across all users
- **UUID Primary Key**: Uses UUID v7 for primary keys
- **Reactivation**: Deleted users can be reactivated by creating them again

## Architecture

### Service Layer (`services/user.service.ts`)

- Business logic for user operations
- Handles user creation and updates
- Generates UUIDs for new users

### Repository Layer (`repositories/users.ts`)

- Database access layer
- Implements connection pooling
- Handles SQL queries and data mapping

### Handler Layer (`handlers/index.ts`)

- HTTP request/response handling
- Input validation and error handling
- Fastify route definitions

### Configuration (`config.ts`)

- Environment variable management
- Database connection configuration

## Logging

The service uses Winston for logging with:

- Console output with colorized formatting
- JSON structured logging
- Logzio integration for centralized logging
- Request/response logging for debugging
