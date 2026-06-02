import { useMemo, useState } from 'react';
import { AudioManager } from './audio/AudioManager';
import { PlaylistProvider } from './audio/PlaylistProvider';
import { ClubScene } from './components/ClubScene';
import { connectToRoom, sendCloud, sendDance } from './network/socket';
import { useClubStore } from './state/clubStore';

const CLOUD_PRESETS = ['here', 'bar?', 'nice set'];

export function App() {
  const phase = useClubStore((state) => state.phase);
  const connected = useClubStore((state) => state.connected);
  const displayName = useClubStore((state) => state.displayName);
  const avatarStyle = useClubStore((state) => state.avatarStyle);
  const selfId = useClubStore((state) => state.selfId);
  const self = useClubStore((state) => (state.selfId ? state.players[state.selfId] : undefined));
  const setPhase = useClubStore((state) => state.setPhase);
  const setIdentity = useClubStore((state) => state.setIdentity);
  const [customCloud, setCustomCloud] = useState('');
  const audioManager = useMemo(() => new AudioManager(new PlaylistProvider()), []);

  function enterClub(name: string, style: number) {
    setIdentity(name, style);
    connectToRoom(name, style);
    void audioManager.start();
    setPhase('club');
  }

  function emitCloud(text: string) {
    const cleaned = text.trim().slice(0, 24);
    if (cleaned) {
      sendCloud(cleaned);
      setCustomCloud('');
    }
  }

  if (phase === 'join') {
    return <JoinPanel onJoin={enterClub} />;
  }

  return (
    <main className="app-shell">
      <section className="club-stage" aria-label="Virtual headphone club">
        <ClubScene />
      </section>
      <aside className="club-hud" aria-label="Club controls">
        <div>
          <p className="eyebrow">Warehouse 01</p>
          <h1>{displayName}</h1>
          <p className={connected ? 'status online' : 'status'}>{connected ? 'live room' : 'reconnecting'}</p>
        </div>
        <div className="hud-row">
          <span>style {avatarStyle + 1}</span>
          <span>{selfId ? selfId.slice(0, 6) : 'joining'}</span>
        </div>
        <div className="cloud-panel">
          {CLOUD_PRESETS.map((preset) => (
            <button key={preset} type="button" onClick={() => emitCloud(preset)}>
              {preset}
            </button>
          ))}
        </div>
        <form
          className="cloud-form"
          onSubmit={(event) => {
            event.preventDefault();
            emitCloud(customCloud);
          }}
        >
          <input
            value={customCloud}
            onChange={(event) => setCustomCloud(event.target.value)}
            placeholder="say less"
            maxLength={24}
          />
          <button type="submit">send</button>
        </form>
        <button type="button" className="dance-button" onClick={() => sendDance(!self?.dancing)}>
          {self?.dancing ? 'still' : 'dance'}
        </button>
      </aside>
    </main>
  );
}

type JoinPanelProps = {
  onJoin: (displayName: string, avatarStyle: number) => void;
};

function JoinPanel({ onJoin }: JoinPanelProps) {
  const [name, setName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState(0);
  const canJoin = name.trim().length > 0;

  return (
    <main className="join-screen">
      <section className="join-copy">
        <p className="eyebrow">silent entry</p>
        <h1>Headphone Club</h1>
        <p>One shared room. Dark floor. Moving silhouettes. No login.</p>
      </section>
      <form
        className="join-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (canJoin) {
            onJoin(name.trim().slice(0, 16), avatarStyle);
          }
        }}
      >
        <label>
          Display name
          <input value={name} onChange={(event) => setName(event.target.value)} autoFocus maxLength={16} />
        </label>
        <div className="avatar-grid" role="radiogroup" aria-label="Avatar style">
          {Array.from({ length: 6 }, (_, index) => (
            <button
              key={index}
              type="button"
              className={avatarStyle === index ? 'avatar-swatch selected' : 'avatar-swatch'}
              onClick={() => setAvatarStyle(index)}
              aria-pressed={avatarStyle === index}
            >
              <span style={{ background: `var(--avatar-${index})` }} />
              {index + 1}
            </button>
          ))}
        </div>
        <button type="submit" disabled={!canJoin}>
          enter
        </button>
      </form>
    </main>
  );
}
