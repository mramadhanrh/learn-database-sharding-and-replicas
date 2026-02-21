-- Create users table
CREATE TABLE
IF NOT EXISTS users
(
  id UUID PRIMARY KEY,
  email VARCHAR
(255) NOT NULL UNIQUE,
  name VARCHAR
(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX
IF NOT EXISTS idx_users_email ON users
(email);
CREATE INDEX
IF NOT EXISTS idx_users_created_at ON users
(created_at DESC);
