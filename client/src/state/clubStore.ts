import { create } from 'zustand';
import type { ClientPhase, CloudState, PlayerState, VectorPosition } from '../types';

type ClubStore = {
  phase: ClientPhase;
  connected: boolean;
  selfId?: string;
  displayName: string;
  avatarStyle: number;
  players: Record<string, PlayerState>;
  clouds: Record<string, CloudState>;
  setPhase: (phase: ClientPhase) => void;
  setIdentity: (displayName: string, avatarStyle: number) => void;
  setConnected: (connected: boolean) => void;
  setSnapshot: (selfId: string, players: PlayerState[]) => void;
  upsertPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePosition: (playerId: string, position: VectorPosition) => void;
  setDancing: (playerId: string, dancing: boolean) => void;
  addCloud: (cloud: CloudState) => void;
  pruneClouds: (now: number) => void;
};

export const useClubStore = create<ClubStore>((set) => ({
  phase: 'join',
  connected: false,
  displayName: '',
  avatarStyle: 0,
  players: {},
  clouds: {},
  setPhase: (phase) => set({ phase }),
  setIdentity: (displayName, avatarStyle) => set({ displayName, avatarStyle }),
  setConnected: (connected) => set({ connected }),
  setSnapshot: (selfId, players) =>
    set({
      selfId,
      players: Object.fromEntries(players.map((player) => [player.id, player]))
    }),
  upsertPlayer: (player) =>
    set((state) => ({
      players: { ...state.players, [player.id]: player }
    })),
  removePlayer: (playerId) =>
    set((state) => {
      const next = { ...state.players };
      delete next[playerId];
      return { players: next };
    }),
  updatePosition: (playerId, position) =>
    set((state) => {
      const player = state.players[playerId];
      if (!player) {
        return state;
      }
      return {
        players: {
          ...state.players,
          [playerId]: { ...player, ...position }
        }
      };
    }),
  setDancing: (playerId, dancing) =>
    set((state) => {
      const player = state.players[playerId];
      if (!player) {
        return state;
      }
      return {
        players: {
          ...state.players,
          [playerId]: { ...player, dancing }
        }
      };
    }),
  addCloud: (cloud) =>
    set((state) => ({
      clouds: { ...state.clouds, [cloud.id]: cloud }
    })),
  pruneClouds: (now) =>
    set((state) => ({
      clouds: Object.fromEntries(Object.entries(state.clouds).filter(([, cloud]) => cloud.expiresAt > now))
    }))
}));
