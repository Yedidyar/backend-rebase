CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  joined_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP
);