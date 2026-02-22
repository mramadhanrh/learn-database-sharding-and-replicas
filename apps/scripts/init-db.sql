-- Create users table
-- NOTE: email is NOT UNIQUE because cross-shard uniqueness cannot be enforced
-- at the database level. If needed, enforce at the application layer.
CREATE TABLE
IF NOT EXISTS users
(
  id UUID PRIMARY KEY,
  email VARCHAR
(255) NOT NULL,
  name VARCHAR
(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
-- email index is kept for fast lookups, just not unique
CREATE INDEX
IF NOT EXISTS idx_users_email ON users
(email);
CREATE INDEX
IF NOT EXISTS idx_users_created_at ON users
(created_at DESC);
