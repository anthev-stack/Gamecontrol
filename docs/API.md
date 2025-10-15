# API Documentation

Complete API reference for GameControl.

## Authentication

All server management endpoints require authentication via NextAuth.js session.

### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register
```http
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // optional
}
```

**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "userId": "clx123..."
}
```

---

## Servers

### List All Servers
```http
GET /api/servers
```

**Response (200 OK):**
```json
[
  {
    "id": "clx123...",
    "name": "My CS2 Server",
    "game": "CS2",
    "status": "RUNNING",
    "host": "192.168.1.100",
    "port": 27015,
    "rconPort": 27016,
    "maxPlayers": 10,
    "map": "de_dust2",
    "gameMode": "competitive",
    "customArgs": "-tickrate 128",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z",
    "lastStarted": "2025-01-15T11:00:00.000Z"
  }
]
```

### Get Server by ID
```http
GET /api/servers/{id}
```

**Response (200 OK):** Same as single server object above

**Response (404 Not Found):**
```json
{
  "error": "Server not found"
}
```

### Create Server
```http
POST /api/servers
Content-Type: application/json

{
  "name": "My Minecraft Server",
  "game": "MINECRAFT",
  "host": "192.168.1.100",
  "port": 25565,
  "rconPort": 25575,
  "rconPassword": "secret123",
  "maxPlayers": 20,
  "map": "world",
  "gameMode": "survival",
  "customArgs": ""
}
```

**Required Fields:**
- `name` (string)
- `game` (enum: CS2, MINECRAFT, RUST)
- `host` (string)
- `port` (number)

**Optional Fields:**
- `rconPort` (number)
- `rconPassword` (string)
- `maxPlayers` (number, default: 10)
- `map` (string)
- `gameMode` (string)
- `customArgs` (string)

**Response (201 Created):** Server object

### Update Server
```http
PATCH /api/servers/{id}
Content-Type: application/json

{
  "name": "Updated Server Name",
  "maxPlayers": 32
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response (200 OK):** Updated server object

### Delete Server
```http
DELETE /api/servers/{id}
```

**Response (200 OK):**
```json
{
  "message": "Server deleted successfully"
}
```

---

## Server Control

### Start/Stop/Restart Server
```http
POST /api/servers/{id}/status
Content-Type: application/json

{
  "action": "start" // or "stop", "restart"
}
```

**Response (200 OK):** Updated server object with new status

**Status Flow:**
- `start` → Status changes to `STARTING` → `RUNNING`
- `stop` → Status changes to `STOPPING` → `STOPPED`
- `restart` → Status changes to `STARTING` → `RUNNING`

---

## Data Types

### GameType Enum
```typescript
enum GameType {
  CS2 = "CS2",
  MINECRAFT = "MINECRAFT",
  RUST = "RUST"
}
```

### ServerStatus Enum
```typescript
enum ServerStatus {
  RUNNING = "RUNNING",
  STOPPED = "STOPPED",
  STARTING = "STARTING",
  STOPPING = "STOPPING",
  ERROR = "ERROR"
}
```

### User Role Enum
```typescript
enum Role {
  USER = "USER",
  ADMIN = "ADMIN"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Server not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create server"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- Implementing rate limiting middleware
- Using Vercel's rate limiting features
- Adding Redis for distributed rate limiting

---

## Example Usage

### JavaScript/TypeScript
```typescript
// Fetch all servers
const servers = await fetch('/api/servers', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(res => res.json())

// Create new server
const newServer = await fetch('/api/servers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Server',
    game: 'CS2',
    host: '192.168.1.100',
    port: 27015,
    maxPlayers: 10
  })
}).then(res => res.json())

// Start server
await fetch(`/api/servers/${serverId}/status`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ action: 'start' })
})
```

### cURL
```bash
# List servers
curl http://localhost:3000/api/servers \
  -H "Cookie: next-auth.session-token=..."

# Create server
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "My Server",
    "game": "CS2",
    "host": "192.168.1.100",
    "port": 27015
  }'

# Start server
curl -X POST http://localhost:3000/api/servers/clx123.../status \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"action": "start"}'
```

---

## Webhooks (Future Feature)

Future versions may include webhooks for:
- Server status changes
- Server creation/deletion
- Error notifications
- Player join/leave events

---

**Questions?** Open an issue on GitHub!

