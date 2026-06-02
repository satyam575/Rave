import type { MusicProvider, MusicProviderState } from './MusicProvider';

export class PlaylistProvider implements MusicProvider {
  readonly name = 'local-playlist';
  state: MusicProviderState = 'idle';
  private audio?: HTMLAudioElement;
  private readonly tracks: string[];

  constructor(tracks: string[] = ['/audio/placeholder-silence.wav']) {
    this.tracks = tracks;
  }

  async load() {
    this.state = 'loading';
    this.audio = new Audio(this.tracks[0]);
    this.audio.loop = true;
    this.audio.volume = 0.35;

    await new Promise<void>((resolve, reject) => {
      if (!this.audio) {
        reject(new Error('Audio element was not created'));
        return;
      }

      this.audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      this.audio.addEventListener('error', () => reject(new Error('Playlist track unavailable')), { once: true });
      this.audio.load();
    });

    this.state = 'ready';
  }

  async play() {
    if (!this.audio) {
      await this.load();
    }
    await this.audio?.play();
    this.state = 'playing';
  }

  pause() {
    this.audio?.pause();
    this.state = 'paused';
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  dispose() {
    this.audio?.pause();
    this.audio = undefined;
    this.state = 'idle';
  }
}
