export type ClientPhase = 'join' | 'club';

export type VectorPosition = {
  x: number;
  z: number;
  facing: number;
};

export type PlayerState = VectorPosition & {
  id: string;
  displayName: string;
  avatarStyle: number;
  dancing: boolean;
};

export type CloudState = {
  id: string;
  playerId: string;
  text: string;
  expiresAt: number;
};

export type ServerMessage =
  | { type: 'snapshot'; senderId?: string; payload: { selfId: string; players: PlayerState[] } }
  | { type: 'player_join'; senderId: string; payload: PlayerState }
  | { type: 'player_leave'; senderId: string; payload: { playerId: string } }
  | { type: 'position'; senderId: string; payload: PlayerState }
  | { type: 'avatar'; senderId: string; payload: PlayerState }
  | { type: 'dance'; senderId: string; payload: { playerId: string; dancing: boolean } }
  | { type: 'cloud'; senderId: string; payload: CloudState };

export type ClientMessage =
  | { type: 'join'; payload: { displayName: string; avatarStyle: number } }
  | { type: 'position'; payload: VectorPosition }
  | { type: 'dance'; payload: { dancing: boolean } }
  | { type: 'cloud'; payload: { text: string } };
