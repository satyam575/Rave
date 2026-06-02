export type MusicProviderState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'fallback';

export interface MusicProvider {
  readonly name: string;
  readonly state: MusicProviderState;
  load(): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  setVolume(volume: number): void;
  dispose(): void;
}
