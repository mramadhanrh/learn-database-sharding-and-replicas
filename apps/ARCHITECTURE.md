# Architecture Overview & Setup Guide

## Project Structure

```
apps/
├── src/
│   ├── config/              # Configuration & Environment
│   │   └── env.ts          # Environment variable validation
│   │
│   ├── domain/              # Core Business Logic (Entities)
│   │   └── user.ts         # User interfaces & types
│   │
│   ├── application/         # Business Logic & Use Cases
│   │   ├── schemas/        # Zod validation schemas
│   │   │   └── user.schema.ts
│   │   └── services/       # Business logic services
│   │       └── user.service.ts
│   │
│   ├── infrastructure/      # External Services & Data Access
│   │   └── database.ts     # PostgreSQL connection pool
│   │
│   ├── presentation/        # HTTP Layer & API Routes
│   │   └── routes/
│   │       └── user.routes.ts
│   │
│   ├── middleware/          # Express Middleware
│   │   └── validation.ts   # Zod validation & error handling
│   │
│   └── index.ts            # Application entry point
│
├── scripts/
│   └── init-db.sql         # Database initialization
│
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── biome.json              # Biome linter configuration
├── Dockerfile              # Docker build configuration
├── docker-compose.yml      # Production docker-compose
├── docker-compose.dev.yml  # Development docker-compose
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── README.md              # Full documentation
├── QUICKSTART.md          # Quick start guide
└── API_EXAMPLES.md        # API usage examples
```

## Clean Architecture Layers Explained

### 1. **Domain Layer** (`src/domain/`)

- Contains core business entities and interfaces
- No dependencies on other layers
- Defines the `User` interface with properties like `id`, `email`, `name`, `createdAt`, `updatedAt`
- Defines input/output interfaces for operations

### 2. **Application Layer** (`src/application/`)

- Contains business logic and use cases
- **Schemas**: Zod validation schemas for request validation
  - `CreateUserSchema`: Validates email (valid format) and name (1-255 chars)
  - `UpdateUserSchema`: Optional email and name fields
  - `GetUserSchema`: Validates UUID format for user IDs
- **Services**: Business logic (UserService)
  - `createUser()`: Creates a new user with UUID
  - `getUserById()`: Fetches user by ID
  - `updateUser()`: Updates user fields
  - `deleteUser()`: Deletes user
  - `getAllUsers()`: Fetches all users

### 3. **Infrastructure Layer** (`src/infrastructure/`)

- Manages external dependencies (database, APIs, etc.)
- Database connection initialization and pooling
- Uses pg library for PostgreSQL connection
- Singleton pattern for database instance

### 4. **Presentation Layer** (`src/presentation/`)

- HTTP routes and API endpoints
- Express route handlers
- Response formatting and status codes
- All CRUD operations for User resource

### 5. **Middleware Layer** (`src/middleware/`)

- Validation middleware using Zod schemas
- Error handling middleware
- Validates request body, params, and query

### 6. **Configuration Layer** (`src/config/`)

- Environment variable management
- Configuration validation
- Centralized config object

## Key Features Implemented

### ✅ PostgreSQL Connection

```typescript
// Singleton pool management
const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
});
```

### ✅ Zod Validation

```typescript
// Schema validation in middleware
app.post("/api/users", validate(CreateUserSchema, "body"), handler);
```

### ✅ CORS & Body Parser

```typescript
app.use(cors());
app.use(express.json({ limit: "10mb" }));
```

### ✅ Biome Configuration

- ESLint-like rules
- Formatter with consistent style
- Linting on save

### ✅ Docker Setup

- Multi-stage Dockerfile for optimized builds
- docker-compose.yml for production
- docker-compose.dev.yml for development
- PostgreSQL service with init scripts

### ✅ Dev Watch Mode

```bash
npm run dev  # Watches src/index.ts with --watch
```

## Dependencies

### Production

- `express`: Web framework
- `pg`: PostgreSQL driver
- `zod`: Schema validation
- `cors`: CORS middleware

### Development

- `typescript`: Type checking
- `@types/*`: Type definitions
- `biome`: Linting and formatting

## Environment Variables

Required in `.env`:

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=app_db
```

## Database Schema

The application creates a `users` table:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Indexes for performance:

- `idx_users_email`: On email column
- `idx_users_created_at`: On created_at DESC

## API Endpoints

| Method | Path             | Description     |
| ------ | ---------------- | --------------- |
| POST   | `/api/users`     | Create new user |
| GET    | `/api/users`     | Get all users   |
| GET    | `/api/users/:id` | Get user by ID  |
| PUT    | `/api/users/:id` | Update user     |
| DELETE | `/api/users/:id` | Delete user     |
| GET    | `/health`        | Health check    |

## NPM Scripts

```json
{
  "dev": "bun run --watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "lint": "biome lint src/",
  "format": "biome format src/ --write"
}
```

## Getting Started

1. **Install**: `npm install`
2. **Configure**: `cp .env.example .env`
3. **Database**: `docker-compose -f docker-compose.dev.yml up -d`
4. **Initialize**: `psql -U postgres -h localhost -f scripts/init-db.sql`
5. **Develop**: `npm run dev`
6. **Test**: See API_EXAMPLES.md for curl commands

## Production Deployment

```bash
# Build
npm run build

# Run with Docker
docker-compose up -d

# Or manually
npm start
```

## Error Handling

All errors are caught and returned as JSON:

```json
{
  "error": "Description",
  "message": "Detailed message"
}
```

Validation errors return 400 status with schema validation details.

---

This architecture ensures:

- ✅ Separation of concerns
- ✅ Easy to test (services are decoupled)
- ✅ Type-safe (TypeScript)
- ✅ Validated inputs (Zod)
- ✅ Clean code (Biome)
- ✅ Scalable structure
