# Architecture

## Overview

The MVP is a two-package monorepo:

- `client`: renders the virtual club, manages local UI state, and sends realtime actions over WebSocket.
- `server`: owns in-memory room state and broadcasts simple JSON events to every connected browser.

There is one room, no authentication, no database, and no production deployment configuration.

## Client Modules

### Rendering

`client/src/components/ClubScene.tsx` uses React Three Fiber to render a dark warehouse-style 2.5D scene:

- concrete floor and grid lines
- back wall, pillars, DJ booth, speaker stacks, and neon strips
- visible bar zone with no commerce flow
- player avatars and muted background NPC dancers
- temporary text-cloud sprites above avatars

Movement is client-side for responsiveness. The client sends throttled position updates to the server, and the server rebroadcasts them to other clients.

### State

`client/src/state/clubStore.ts` uses Zustand for:

- connection status
- local player id
- remote player map
- temporary cloud events
- selected display name and avatar style

### Realtime

`client/src/network/socket.ts` wraps the browser `WebSocket` API. It sends:

- `join`
- `position`
- `dance`
- `cloud`

It receives server events and applies them to the Zustand store.

### Audio

`client/src/audio/AudioManager.ts` coordinates playback through a provider interface:

- `MusicProvider`: minimal contract for future providers
- `PlaylistProvider`: tries local playlist URLs first
- silent fallback: keeps the audio lifecycle working when no placeholder file exists

This keeps future music integrations out of rendering and state code.

## Server Modules

### WebSocket Endpoint

`server/src/main/java/com/rave/club/config/WebSocketConfig.java` registers:

- endpoint: `/ws/room`
- transport: raw Spring WebSocket JSON messages
- origins: permissive for local MVP development

### Room State

`RoomState` stores players in memory by WebSocket session id. It validates and clamps:

- display names
- avatar styles
- positions
- cloud text

The state disappears when the server restarts.

### Broadcast Handler

`ClubWebSocketHandler` parses client messages, mutates `RoomState`, and broadcasts normalized server messages:

- `snapshot`
- `player_join`
- `player_leave`
- `position`
- `avatar`
- `dance`
- `cloud`

## Protocol Strategy

The schema intentionally stays small:

```json
{
  "type": "cloud",
  "senderId": "session-id",
  "payload": {
    "playerId": "session-id",
    "text": "bar?",
    "expiresAt": 1760000000000
  }
}
```

Future versions should add:

- protocol version in every message
- server timestamps on all events
- heartbeat and reconnect behavior
- interpolation metadata for smoother remote movement
- room ids when multiple rooms exist

## Future Music Provider Strategy

The `MusicProvider` interface is intentionally small:

- `load()`
- `play()`
- `pause()`
- `setVolume()`
- `dispose()`

Likely future providers:

- `PlaylistProvider`: local curated assets for development and fallback environments
- `StreamingPreviewProvider`: licensed short previews from a legal API
- `LiveSetProvider`: scheduled DJ sets or uploaded mixes
- `ExternalSyncProvider`: metadata-only sync to a user-owned playback service

Provider implementations should emit track metadata and playback state through a separate audio store. Club room presence should not depend on a music provider being available.
