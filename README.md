# Virtual Headphone Club MVP

A browser-based virtual headphone club MVP with a React/Three.js client and a Spring Boot WebSocket server.

## Structure

- `client` - React + Vite + TypeScript + Three.js + React Three Fiber + Zustand
- `server` - Spring Boot Java WebSocket server with in-memory room state
- `docs` - architecture and protocol notes

## Requirements

- Node.js 20+
- Java 21+
- Maven 3.9+

## Run Locally

Start the backend:

```bash
cd server
mvn spring-boot:run
```

Start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Open multiple browser windows to see realtime avatar movement.

The client connects to `ws://localhost:8080/ws/room` by default. Override it with:

```bash
VITE_WS_URL=ws://localhost:8080/ws/room npm run dev
```

## MVP Controls

- `WASD` or arrow keys: move
- `Space`: toggle dance pulse
- Cloud buttons: send a 2-second text cloud above your avatar
- Audio: starts through the `AudioManager`; if no playlist file is available it uses a silent fallback

## Message Schema

All WebSocket messages are JSON:

```json
{
  "type": "position",
  "senderId": "optional-server-session-id",
  "payload": {}
}
```

Client-to-server message types:

- `join` - `{ "displayName": "Mina", "avatarStyle": 2 }`
- `position` - `{ "x": 1.2, "z": -3.4, "facing": 1.57 }`
- `dance` - `{ "dancing": true }`
- `cloud` - `{ "text": "nice set" }`

Server-to-client message types:

- `snapshot` - current room state sent to the connecting client
- `player_join` - a player joined
- `player_leave` - a player left
- `position` - a player moved
- `avatar` - display name or avatar style changed
- `dance` - a player toggled dancing
- `cloud` - a temporary text cloud event

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module details and future provider strategy.
