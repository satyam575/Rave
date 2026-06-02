import { useClubStore } from '../state/clubStore';
import type { ClientMessage, ServerMessage, VectorPosition } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws/room';

let socket: WebSocket | undefined;

function send(message: ClientMessage) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function handleMessage(message: ServerMessage) {
  const store = useClubStore.getState();

  switch (message.type) {
    case 'snapshot':
      store.setSnapshot(message.payload.selfId, message.payload.players);
      break;
    case 'player_join':
    case 'avatar':
    case 'position':
      store.upsertPlayer(message.payload);
      break;
    case 'player_leave':
      store.removePlayer(message.payload.playerId);
      break;
    case 'dance':
      store.setDancing(message.payload.playerId, message.payload.dancing);
      break;
    case 'cloud':
      store.addCloud(message.payload);
      break;
  }
}

export function connectToRoom(displayName: string, avatarStyle: number) {
  socket?.close();
  socket = new WebSocket(WS_URL);

  socket.addEventListener('open', () => {
    useClubStore.getState().setConnected(true);
    send({ type: 'join', payload: { displayName, avatarStyle } });
  });

  socket.addEventListener('close', () => {
    useClubStore.getState().setConnected(false);
  });

  socket.addEventListener('message', (event) => {
    try {
      handleMessage(JSON.parse(event.data) as ServerMessage);
    } catch (error) {
      console.warn('Ignored malformed server message', error);
    }
  });
}

export function sendPosition(position: VectorPosition) {
  send({ type: 'position', payload: position });
}

export function sendDance(dancing: boolean) {
  send({ type: 'dance', payload: { dancing } });
}

export function sendCloud(text: string) {
  send({ type: 'cloud', payload: { text } });
}
