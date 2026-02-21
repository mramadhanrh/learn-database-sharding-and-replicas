# Express API with PostgreSQL

A clean architecture Express application with TypeScript, PostgreSQL, Zod validation, and more.

## Architecture

```
src/
├── config/              # Configuration and environment
├── domain/              # Core business logic and entities
├── application/         # Use cases and services
│   ├── schemas/        # Zod validation schemas
│   └── services/       # Business logic services
├── infrastructure/      # Database and external services
├── presentation/        # Routes and controllers
└── middleware/          # Express middleware
```

## Features

- ✅ Express.js with TypeScript
- ✅ PostgreSQL database connection
- ✅ Zod validation for request schemas and middleware
- ✅ CORS and body parser setup
- ✅ Clean architecture principles
- ✅ Biome linter and formatter
- ✅ Docker and docker-compose setup
- ✅ Dev watch mode
- ✅ Sample User API (CRUD operations)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 12+
- Docker (optional)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy and configure environment variables:

```bash
cp .env.example .env
```

3. Start PostgreSQL (if using Docker):

```bash
docker-compose up postgres -d
```

4. Initialize the database:

```bash
psql -U postgres -h localhost -d app_db -f scripts/init-db.sql
```

### Development

Start the development server with watch mode:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`

### Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

Or use Docker:

```bash
docker-compose up app
```

## Linting and Formatting

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## API Endpoints

### User Management

#### Create User

```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### Get All Users

```bash
GET /api/users
```

#### Get User by ID

```bash
GET /api/users/{id}
```

#### Update User

```bash
PUT /api/users/{id}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "name": "Jane Doe"
}
```

#### Delete User

```bash
DELETE /api/users/{id}
```

#### Health Check

```bash
GET /health
```

## Project Structure

- **Domain**: Core user entity and interfaces
- **Application**: User service for business logic and Zod schemas for validation
- **Infrastructure**: Database connection and pool management
- **Presentation**: API routes and response handling
- **Middleware**: Zod validation middleware and error handling
- **Config**: Environment variables and configuration

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

See `.env.example` for all available configuration options.

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
