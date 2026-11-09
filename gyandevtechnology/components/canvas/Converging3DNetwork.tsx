'use client';

import React, { useRef, useMemo, useSyncExternalStore } from 'react';
import '@/lib/suppressThreeClock';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

const getReducedMotionSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getReducedMotionServerSnapshot = () => false;

const WideConstellationScene: React.FC<{ isReducedMotion: boolean }> = ({ isReducedMotion }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 48;

  // Position particles along outer flanks (|x| >= 2.0 or broad ambient envelope) so center text is clean
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const xBase = side * (2.4 + (i % 6) * 0.45);
      const yBase = (pseudoRandom(i + 1) - 0.5) * 3.2;
      const zBase = (pseudoRandom(i + 101) - 0.5) * 1.8;

      return {
        pos: new THREE.Vector3(xBase, yBase, zBase),
        orig: new THREE.Vector3(xBase, yBase, zBase),
        speed: 0.3 + pseudoRandom(i + 201) * 0.4,
        scale: 0.045 + pseudoRandom(i + 301) * 0.04,
        color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#2563eb' : '#60a5fa',
      };
    });
  }, [count]);

  const meshRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    if (!isReducedMotion) {
      groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.08;
    }

    particles.forEach((p, idx) => {
      const mesh = meshRefs.current[idx];
      if (!mesh) return;

      mesh.position.y = p.orig.y + Math.sin(t * p.speed + idx) * 0.15;
      mesh.position.x = p.orig.x + Math.cos(t * p.speed * 0.8 + idx) * 0.12;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshRefs.current[i] = el;
          }}
          position={p.pos}
          scale={p.scale}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
};

export const Converging3DNetwork: React.FC = () => {
  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div className="absolute inset-0 pointer-events-none opacity-60 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        className="w-full h-full"
      >
        <WideConstellationScene isReducedMotion={isReducedMotion} />
      </Canvas>
    </div>
  );
};
export default Converging3DNetwork;
