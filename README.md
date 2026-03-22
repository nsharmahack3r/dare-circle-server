# 🎲 Dare Circle — Multiplayer Game

A real-time multiplayer Truth or Dare game with JWT authentication, room management, and a spin wheel mechanic. Built with **Node.js**, **Express**, **Socket.IO**, **MongoDB**, and **TypeScript**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [REST API](#rest-api)
- [Socket Events](#socket-events)
- [Game Flow](#game-flow)
- [Data Schemas](#data-schemas)
- [Error Reference](#error-reference)

---

## Features

- 🔐 **Email & password authentication** — JWT-based with bcrypt hashing
- 🏠 **Room management** — create and join rooms with a 4-character code
- 🎡 **Spin wheel mechanic** — host spins to randomly select a player each round
- 🔢 **Spin counter** — tracks total spins played per game session
- 🔄 **Real-time sync** — all game state pushed to every player via Socket.IO
- 👑 **Host controls** — only the host can spin, start, complete turns, and end the game
- 🔌 **Disconnect handling** — players are removed on disconnect; host is reassigned automatically

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Runtime      | Node.js + TypeScript                       |
| HTTP Server  | Express                                    |
| Real-time    | Socket.IO                                  |
| Database     | MongoDB + Mongoose                         |
| Validation   | Zod                                        |
| Auth         | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| DI Container | InversifyJS                                |

---

## Project Structure

```
src/
├── models/
│   └── user/
│       ├── model.ts          # Mongoose User model (bcrypt password hashing)
│       └── schema.ts         # Zod schemas for register / login
├── services/
│   └── auth.service.ts       # register, login, JWT sign / verify
├── controllers/
│   └── auth.controller.ts    # HTTP handlers for auth endpoints
├── middleware/
│   └── auth.ts               # authMiddleware (HTTP) + verifySocketToken
├── routes/
│   ├── auth.routes.ts        # /api/auth/*
│   └── room.routes.ts        # /api/rooms/* (all protected)
├── game/
│   ├── GameManager.ts        # In-memory game state + spin logic
│   └── questions.ts          # Truth & dare question banks
├── types/
│   └── game.types.ts         # Room, Player, SpinResult, enums
├── di/
│   └── container.ts          # InversifyJS container
├── socketHandler.ts          # All socket events (auth middleware applied)
├── routes.ts                 # Root router
└── server.ts                 # Express + Socket.IO + MongoDB bootstrap
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build and run in production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable     | Default                                | Description                                                 |
| ------------ | -------------------------------------- | ----------------------------------------------------------- |
| `PORT`       | `3000`                                 | HTTP server port                                            |
| `MONGO_URI`  | `mongodb://localhost:27017/truth-dare` | MongoDB connection string                                   |
| `JWT_SECRET` | `truth-dare-secret-key`                | Secret key for signing JWTs — **change this in production** |

---

## REST API

Base URL: `http://localhost:3000/api`

Protected endpoints require: `Authorization: Bearer <token>`

### Auth

#### `POST /auth/register`

Create a new user account.

**Request body:**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Response `201`:**

```json
{
  "user": {
    "id": "64f2a1b3c8e1234567890abc",
    "name": "Alice",
    "email": "alice@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:** `400` validation failed · `409` email already registered

---

#### `POST /auth/login`

Authenticate and receive a JWT.

**Request body:**

```json
{
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Response `200`:** same shape as register.

**Errors:** `400` validation failed · `401` invalid credentials

---

#### `GET /auth/me` 🔒

Returns the authenticated user's identity decoded from the token.

**Response `200`:**

```json
{
  "user": {
    "userId": "64f2a1b3c8e1234567890abc",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

---

### Rooms

All room endpoints require a valid Bearer token.

#### `POST /rooms` 🔒

Create a new game room. The caller automatically becomes the host.

**Response `201`:**

```json
{
  "code": "AB3X",
  "hostId": "64f2a1b3c8e1234567890abc",
  "status": "waiting",
  "spinCount": 0,
  "spinState": "idle",
  "currentSpin": null,
  "players": [
    { "id": "64f2a1b3c8e1234567890abc", "name": "Alice", "hasPlayed": false }
  ]
}
```

---

#### `POST /rooms/:code/join` 🔒

Join an existing room by its 4-character code. Only available while the room is in `waiting` status.

**Response `200`:**

```json
{
  "player": {
    "id": "64f2a1b3c8e1234567890def",
    "name": "Bob",
    "hasPlayed": false
  },
  "room": { ... }
}
```

**Errors:** `404` room not found or game already started

---

#### `GET /rooms/:code` 🔒

Fetch the full current state of a room. Useful for page refresh or reconnect.

**Response `200`:** Full `Room` object — see [Data Schemas](#data-schemas).

---

## Socket Events

### Connection

Pass the JWT in the socket handshake `auth` object:

```js
const socket = io("http://localhost:3000", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
});

socket.on("connect_error", (err) => {
  // err.message === "Authentication token required"
  // err.message === "Invalid or expired token"
});
```

---

### Client → Server

| Event           | Payload            | Who    | Description                                     |
| --------------- | ------------------ | ------ | ----------------------------------------------- |
| `join-room`     | `{ code }`         | Anyone | Subscribe to room updates after HTTP join       |
| `start-game`    | `{ code }`         | Host   | Start game — requires ≥ 2 players               |
| `spin`          | `{ code }`         | Host   | Spin the wheel, randomly picks a player         |
| `spin-landed`   | `{ code }`         | Anyone | Fire after the spin animation finishes          |
| `choose`        | `{ code, choice }` | Target | Pick `"truth"` or `"dare"`                      |
| `complete-turn` | `{ code }`         | Host   | Mark the current turn done, reset for next spin |
| `end-game`      | `{ code }`         | Host   | End the game session                            |

---

### Server → Client

| Event         | Payload             | Description                                             |
| ------------- | ------------------- | ------------------------------------------------------- |
| `room:update` | Full `Room` object  | Broadcast to all players on any state change            |
| `spin:result` | `SpinResult` object | Emitted on spin — use this to drive the wheel animation |
| `error`       | `string`            | Sent only to the socket that caused the error           |

---

## Game Flow

```
1. Players register / login  →  receive JWT

2. Host:   POST /api/rooms          →  gets room code
   Others: POST /api/rooms/:code/join

3. All:    socket emit "join-room"  →  receive room:update

4. Host:   emit "start-game"
           status: waiting → playing
           spinState: idle

── Repeat until host ends game ──────────────────────────────

5. Host emits "spin"
     spinState: idle → spinning
     server picks a random player
     all clients receive spin:result  ← animate wheel here

6. Clients finish animation, emit "spin-landed"
     spinState: spinning → landed
     all clients receive room:update

7. Target player emits "choose" with "truth" or "dare"
     server assigns a random question
     spinState: landed → answering
     all clients receive room:update with the question

8. Host emits "complete-turn"
     spinState: answering → idle
     spinCount stays, player fields reset
     ready for next spin

─────────────────────────────────────────────────────────────

9. Host emits "end-game"
     status: playing → finished
```

---

## Data Schemas

### Room

```ts
{
  code: string;           // 4-character room code, e.g. "AB3X"
  hostId: string;         // userId of the host
  status: "waiting" | "playing" | "finished";
  spinCount: number;      // total spins in this session (never resets)
  spinState: "idle" | "spinning" | "landed" | "answering";
  currentSpin: SpinResult | undefined;
  players: Player[];
}
```

### Player

```ts
{
  id: string;             // userId from JWT
  name: string;
  socketId?: string;      // current socket connection id
  hasPlayed: boolean;
  choice?: "truth" | "dare";
  question?: string;      // assigned after player chooses
}
```

### SpinResult

```ts
{
  targetPlayerId: string;
  targetPlayerName: string;
  spinNumber: number; // equals room.spinCount at time of spin
}
```

### spinState machine

```
idle ──[host spins]──▶ spinning ──[animation done]──▶ landed
                                                         │
                                                  [player chooses]
                                                         │
                                                         ▼
                                  idle ◀──[host completes]── answering
```

---

## Error Reference

### HTTP errors

| Status | Endpoint                 | Reason                                     |
| ------ | ------------------------ | ------------------------------------------ |
| `400`  | `POST /auth/register`    | Validation failed — field-level Zod errors |
| `400`  | `POST /auth/login`       | Validation failed                          |
| `401`  | Any protected route      | Missing or invalid Bearer token            |
| `401`  | `POST /auth/login`       | Wrong email or password                    |
| `404`  | `POST /rooms/:code/join` | Room not found or game already started     |
| `404`  | `GET /rooms/:code`       | Room not found                             |
| `409`  | `POST /auth/register`    | Email already registered                   |

### Socket errors

All socket errors are emitted as `error` events to the triggering socket only.

| Trigger                       | Message                               |
| ----------------------------- | ------------------------------------- |
| `start-game` (non-host)       | `Only the host can start the game`    |
| `start-game` (< 2 players)    | `Need at least 2 players to start`    |
| `spin` (non-host)             | `Only the host can spin`              |
| `spin` (turn in progress)     | `Wait for the current turn to finish` |
| `choose` (wrong player)       | `You are not the target this round`   |
| `choose` (wrong state)        | `Not your turn yet`                   |
| `complete-turn` (non-host)    | `Only the host can complete a turn`   |
| `complete-turn` (wrong state) | `No active answer to complete`        |
| `end-game` (non-host)         | `Only the host can end the game`      |
| Any event (unauthenticated)   | `Not authenticated`                   |
