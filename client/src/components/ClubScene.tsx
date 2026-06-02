import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sendDance, sendPosition } from '../network/socket';
import { useClubStore } from '../state/clubStore';
import type { CloudState, PlayerState } from '../types';

const AVATAR_COLORS = ['#00d1ff', '#ff3d8b', '#ffe156', '#63ff9a', '#b892ff', '#ff8a3d'];
const keys = new Set<string>();

const npcPositions = [
  [-7, -2.2, 0],
  [-5.6, -3.2, 1],
  [-4.2, -1.8, 2],
  [4.4, -3.1, 3],
  [5.9, -2.2, 4],
  [7.2, -3.4, 5],
  [-1.5, -4.8, 1],
  [1.8, -4.6, 4]
] as const;

export function ClubScene() {
  const players = useClubStore((state) => Object.values(state.players));
  const clouds = useClubStore((state) => Object.values(state.clouds));
  const selfId = useClubStore((state) => state.selfId);
  const pruneClouds = useClubStore((state) => state.pruneClouds);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.add(event.key.toLowerCase());
      if (event.code === 'Space' && !event.repeat) {
        const store = useClubStore.getState();
        const self = store.selfId ? store.players[store.selfId] : undefined;
        if (self) {
          sendDance(!self.dancing);
        }
      }
    };
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => pruneClouds(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [pruneClouds]);

  return (
    <Canvas orthographic camera={{ position: [0, 13, 12], zoom: 48, rotation: [-Math.PI / 4, 0, 0] }}>
      <color attach="background" args={['#050608']} />
      <fog attach="fog" args={['#050608', 12, 34]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[-5, 6, 2]} intensity={14} color="#ff2f8f" />
      <pointLight position={[5, 5, -2]} intensity={10} color="#00d1ff" />
      <ClubEnvironment />
      {npcPositions.map(([x, z, style], index) => (
        <NpcDancer key={`${x}-${z}`} x={x} z={z} style={style} index={index} />
      ))}
      {players.map((player) => (
        <PlayerAvatar key={player.id} player={player} isSelf={player.id === selfId} clouds={clouds} />
      ))}
      <SelfMovementController />
    </Canvas>
  );
}

function SelfMovementController() {
  const selfId = useClubStore((state) => state.selfId);
  const lastSent = useRef(0);

  useFrame((_, delta) => {
    if (!selfId) {
      return;
    }

    const store = useClubStore.getState();
    const self = store.players[selfId];
    if (!self) {
      return;
    }

    const dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    const dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));

    if (dx === 0 && dz === 0) {
      return;
    }

    const length = Math.hypot(dx, dz) || 1;
    const speed = 4.2;
    const next = {
      x: clamp(self.x + (dx / length) * speed * delta, -9.2, 9.2),
      z: clamp(self.z + (dz / length) * speed * delta, -5.8, 4.8),
      facing: Math.atan2(dx, dz)
    };

    store.updatePosition(selfId, next);

    const now = performance.now();
    if (now - lastSent.current > 50) {
      sendPosition(next);
      lastSent.current = now;
    }
  });

  return null;
}

function ClubEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[22, 15]} />
        <meshStandardMaterial color="#101113" roughness={0.86} metalness={0.12} />
      </mesh>
      <gridHelper args={[22, 22, '#232a31', '#14181d']} position={[0, 0.01, 0]} />
      <mesh position={[0, 2.3, -6.7]}>
        <boxGeometry args={[22, 4.8, 0.35]} />
        <meshStandardMaterial color="#111217" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.15, -5.1]}>
        <boxGeometry args={[3.8, 0.4, 1.1]} />
        <meshStandardMaterial color="#1f2027" emissive="#16161d" />
      </mesh>
      <mesh position={[0, 1.0, -5.35]}>
        <boxGeometry args={[5.4, 0.08, 0.08]} />
        <meshBasicMaterial color="#ff2f8f" />
      </mesh>
      <mesh position={[-8.7, 1.3, -5.1]}>
        <boxGeometry args={[0.9, 2.6, 0.9]} />
        <meshStandardMaterial color="#15171a" />
      </mesh>
      <mesh position={[8.7, 1.3, -5.1]}>
        <boxGeometry args={[0.9, 2.6, 0.9]} />
        <meshStandardMaterial color="#15171a" />
      </mesh>
      <mesh position={[7.4, 0.08, 2.8]}>
        <boxGeometry args={[4.1, 0.18, 2.1]} />
        <meshStandardMaterial color="#202426" emissive="#052927" />
      </mesh>
      <mesh position={[7.4, 0.42, 1.85]}>
        <boxGeometry args={[4.2, 0.12, 0.12]} />
        <meshBasicMaterial color="#63ff9a" />
      </mesh>
      <Label text="BAR" position={[7.4, 0.85, 1.75]} color="#afffd1" scale={1.1} />
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 1.35, 4.9]}>
          <boxGeometry args={[0.42, 2.7, 0.42]} />
          <meshStandardMaterial color="#17191d" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      <Label text="NPC dancers" position={[-5.8, 1.3, -1.2]} color="#8a9199" scale={0.82} />
      <Label text="NPC dancers" position={[5.8, 1.3, -1.2]} color="#8a9199" scale={0.82} />
    </group>
  );
}

function PlayerAvatar({ player, isSelf, clouds }: { player: PlayerState; isSelf: boolean; clouds: CloudState[] }) {
  const ref = useRef<THREE.Group>(null);
  const activeCloud = clouds.find((cloud) => cloud.playerId === player.id);
  const color = AVATAR_COLORS[player.avatarStyle % AVATAR_COLORS.length];

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }
    ref.current.position.lerp(new THREE.Vector3(player.x, 0, player.z), 0.25);
    ref.current.rotation.y = player.facing;
    ref.current.position.y = player.dancing ? Math.sin(clock.elapsedTime * 9) * 0.08 : 0;
  });

  return (
    <group ref={ref} position={[player.x, 0, player.z]}>
      <mesh position={[0, 0.42, 0]}>
        <capsuleGeometry args={[0.24, 0.6, 6, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isSelf ? 0.4 : 0.22} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#dedede" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.28, 0.035, 8, 24]} />
        <meshBasicMaterial color={isSelf ? '#ffffff' : color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.42, 0.5, 28]} />
        <meshBasicMaterial color={isSelf ? '#ffffff' : color} transparent opacity={isSelf ? 0.5 : 0.25} />
      </mesh>
      <Label text={player.displayName} position={[0, 1.45, 0]} color="#f5f5f5" scale={0.72} />
      {activeCloud ? <Label text={activeCloud.text} position={[0, 2.05, 0]} color="#111111" background="#ffffff" scale={0.9} /> : null}
    </group>
  );
}

function NpcDancer({ x, z, style, index }: { x: number; z: number; style: number; index: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 3.2 + index) * 0.06;
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 1.3 + index) * 0.5;
    }
  });

  return (
    <group ref={ref} position={[x, 0, z]}>
      <mesh position={[0, 0.35, 0]}>
        <capsuleGeometry args={[0.18, 0.5, 5, 10]} />
        <meshStandardMaterial color={AVATAR_COLORS[style]} transparent opacity={0.38} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color="#6f757d" transparent opacity={0.5} />
      </mesh>
      <Label text="NPC" position={[0, 1.2, 0]} color="#9aa1aa" scale={0.55} />
    </group>
  );
}

function Label({
  text,
  position,
  color,
  background,
  scale = 1
}: {
  text: string;
  position: [number, number, number];
  color: string;
  background?: string;
  scale?: number;
}) {
  const texture = useMemo(() => makeTextTexture(text, color, background), [text, color, background]);

  return (
    <sprite position={position} scale={[texture.image.width / 160 * scale, texture.image.height / 160 * scale, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}

function makeTextTexture(text: string, color: string, background?: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const font = '600 28px Inter, Arial, sans-serif';
  context.font = font;
  const metrics = context.measureText(text);
  canvas.width = Math.ceil(metrics.width + 38);
  canvas.height = 48;
  context.font = font;
  if (background) {
    context.fillStyle = background;
    roundRect(context, 0, 0, canvas.width, canvas.height, 12);
    context.fill();
  }
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
