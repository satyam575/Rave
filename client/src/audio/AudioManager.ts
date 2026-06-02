import type { MusicProvider, MusicProviderState } from './MusicProvider';

class SilentFallbackProvider implements MusicProvider {
  readonly name = 'silent-fallback';
  state: MusicProviderState = 'fallback';
  private context?: AudioContext;
  private gain?: GainNode;

  async load() {
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(this.context.destination);
  }

  async play() {
    if (!this.context) {
      await this.load();
    }
    await this.context?.resume();
  }

  pause() {
    void this.context?.suspend();
  }

  setVolume() {
    if (this.gain) {
      this.gain.gain.value = 0;
    }
  }

  dispose() {
    void this.context?.close();
    this.context = undefined;
  }
}

export class AudioManager {
  private activeProvider: MusicProvider;

  constructor(private readonly preferredProvider: MusicProvider) {
    this.activeProvider = preferredProvider;
  }

  get providerName() {
    return this.activeProvider.name;
  }

  async start() {
    try {
      await this.preferredProvider.load();
      await this.preferredProvider.play();
      this.activeProvider = this.preferredProvider;
    } catch {
      const fallback = new SilentFallbackProvider();
      await fallback.load();
      await fallback.play();
      this.activeProvider = fallback;
    }
  }

  pause() {
    this.activeProvider.pause();
  }

  setVolume(volume: number) {
    this.activeProvider.setVolume(volume);
  }

  dispose() {
    this.activeProvider.dispose();
  }
}
