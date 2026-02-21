# REST API Examples

## Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "createdAt": "2024-02-21T10:30:00.000Z",
    "updatedAt": "2024-02-21T10:30:00.000Z"
  }
}
```

## Get All Users

```bash
curl http://localhost:3000/api/users
```

## Get User by ID

```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

## Update User

```bash
curl -X PUT http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@example.com",
    "name": "Alice J"
  }'
```

## Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

## Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2024-02-21T10:35:00.000Z"
}
```
