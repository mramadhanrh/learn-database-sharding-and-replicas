# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Setup Environment

```bash
cp .env.example .env
```

## 3. Start PostgreSQL (Choose one)

### Option A: Using Docker (Recommended)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Option B: Local PostgreSQL

Ensure PostgreSQL is running on `localhost:5432`, then:

```bash
psql -U postgres -h localhost -f scripts/init-db.sql
```

## 4. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

## 5. Test the API

### Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### Get All Users

```bash
curl http://localhost:3000/api/users
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Useful Commands

- `npm run dev` - Start dev server with watch mode
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## Docker Production Deployment

```bash
docker-compose up -d
```

This will start both PostgreSQL and the Express application.

## Stop Services

```bash
# Dev database
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose down
```

## Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running: `psql -U postgres -h localhost -c "SELECT 1"`
- Check `.env` file has correct database credentials
- Run init script: `psql -U postgres -h localhost -f scripts/init-db.sql`

### Port Already in Use

- Change `PORT` in `.env` or environment variables
- Or kill existing process: `lsof -ti :3000 | xargs kill -9`

### TypeScript Errors

- Run: `npm install` to ensure all types are installed
- Check: `npm run lint` for code issues

For more details, see [README.md](./README.md) and [API_EXAMPLES.md](./API_EXAMPLES.md)
