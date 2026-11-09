'use client';

import React, { useRef, useMemo, useState, useEffect, useSyncExternalStore } from 'react';
import '@/lib/suppressThreeClock';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

export interface ClusterNode {
  id: string;
  name: string;
  category: string;
  position: [number, number, number];
  color: string;
  subNodes: [number, number, number][];
  size: number;
}

// Flanking cluster topology that leaves the center reading corridor completely open
const CLUSTERS: ClusterNode[] = [
  // Left Outer Flank
  {
    id: 'cloud_flank_left',
    name: 'Cloud & Edge Architecture',
    category: '01.EDGE',
    position: [-5.4, 0.6, -0.6],
    color: '#38bdf8',
    size: 0.17,
    subNodes: [
      [-6.0, 1.1, -0.8],
      [-5.7, -0.2, -0.4],
      [-4.8, 1.0, -0.7],
    ],
  },
  {
    id: 'security_left',
    name: 'Security & Governance Grid',
    category: '02.SECURITY',
    position: [-4.3, -1.2, -0.4],
    color: '#60a5fa',
    size: 0.16,
    subNodes: [
      [-4.9, -1.7, -0.6],
      [-3.8, -1.6, -0.3],
      [-4.6, -0.5, -0.5],
    ],
  },
  {
    id: 'advisory_left',
    name: 'Consulting Strategy Node',
    category: '03.DIAGNOSE',
    position: [-3.3, 1.5, -0.7],
    color: '#0284c7',
    size: 0.17,
    subNodes: [
      [-3.9, 1.9, -0.9],
      [-2.8, 1.9, -0.5],
      [-3.6, 0.8, -0.7],
    ],
  },
  {
    id: 'consulting',
    name: 'Consulting & Advisory',
    category: '04.ADVISORY',
    position: [-2.5, -0.3, -0.4],
    color: '#38bdf8',
    size: 0.16,
    subNodes: [
      [-3.0, 0.2, -0.6],
      [-2.7, -0.9, -0.3],
      [-2.2, 0.4, -0.5],
    ],
  },

  // Right Flank
  {
    id: 'healthcare',
    name: 'Healthcare Systems',
    category: '05.CLINICAL',
    position: [2.5, 0.3, -0.4],
    color: '#60a5fa',
    size: 0.16,
    subNodes: [
      [3.0, 0.8, -0.6],
      [2.8, -0.4, -0.3],
      [2.2, 0.9, -0.5],
    ],
  },
  {
    id: 'implementation',
    name: 'Implementation & Delivery',
    category: '06.EXECUTE',
    position: [3.4, -1.2, -0.5],
    color: '#0284c7',
    size: 0.16,
    subNodes: [
      [3.9, -1.7, -0.7],
      [3.8, -0.5, -0.4],
      [2.9, -1.6, -0.3],
    ],
  },
  {
    id: 'platforms_right',
    name: 'Platform Modernization',
    category: '07.TRANSFORM',
    position: [3.6, 1.5, -0.6],
    color: '#38bdf8',
    size: 0.16,
    subNodes: [
      [4.1, 1.9, -0.8],
      [4.0, 0.9, -0.5],
      [3.2, 1.9, -0.7],
    ],
  },
  {
    id: 'telemetry_right',
    name: 'Observability & Monitoring',
    category: '08.MONITOR',
    position: [4.6, -0.6, -0.5],
    color: '#60a5fa',
    size: 0.16,
    subNodes: [
      [5.1, -1.1, -0.7],
      [4.2, -1.2, -0.4],
      [4.8, 0.1, -0.6],
    ],
  },
  {
    id: 'ecosystem_flank_right',
    name: 'Enterprise Integration Mesh',
    category: '09.MESH',
    position: [5.5, 0.6, -0.6],
    color: '#0284c7',
    size: 0.17,
    subNodes: [
      [6.1, 1.0, -0.8],
      [5.8, -0.1, -0.4],
      [4.9, 1.0, -0.8],
    ],
  },
];

interface AssemblyProps {
  onStateChange?: (state: string, activeNodeName: string | null) => void;
  hoveredCluster: string | null;
  setHoveredCluster: (id: string | null) => void;
  isReducedMotion: boolean;
}

const SceneContent: React.FC<AssemblyProps> = ({
  onStateChange,
  hoveredCluster,
  setHoveredCluster,
  isReducedMotion,
}) => {
  const { mouse, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const assemblyTime = useRef(0);
  const [assemblyProgress, setAssemblyProgress] = useState(isReducedMotion ? 1 : 0);

  const { allPoints, connections } = useMemo(() => {
    const pts: { pos: THREE.Vector3; color: THREE.Color; size: number; isMain: boolean; clusterId: string }[] = [];
    const mainIndices: number[] = [];

    CLUSTERS.forEach((cluster) => {
      const mainIdx = pts.length;
      mainIndices.push(mainIdx);
      pts.push({
        pos: new THREE.Vector3(...cluster.position),
        color: new THREE.Color(cluster.color),
        size: cluster.size,
        isMain: true,
        clusterId: cluster.id,
      });

      cluster.subNodes.forEach((subPos) => {
        pts.push({
          pos: new THREE.Vector3(...subPos),
          color: new THREE.Color(cluster.color),
          size: cluster.size * 0.45,
          isMain: false,
          clusterId: cluster.id,
        });
      });
    });

    // Side ambient constellation points flanking the outer sides (no points in the center |x| < 2.3)
    const sidePointsCount = 20;
    for (let i = 0; i < sidePointsCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (2.4 + pseudoRandom(i * 13 + 5) * 3.8);
      const y = (pseudoRandom(i * 19 + 7) - 0.5) * 3.6;
      const z = (pseudoRandom(i * 23 + 11) - 0.5) * 1.4 - 0.5;
      pts.push({
        pos: new THREE.Vector3(x, y, z),
        color: new THREE.Color(i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#60a5fa' : '#0284c7'),
        size: 0.04 + pseudoRandom(i * 29 + 13) * 0.03,
        isMain: false,
        clusterId: 'ambient',
      });
    }

    const conns: { p1: number; p2: number; dist: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = pts[i].pos.distanceTo(pts[j].pos);
        const sameCluster = pts[i].clusterId === pts[j].clusterId && pts[i].clusterId !== 'ambient';
        const mainConnection = pts[i].isMain && pts[j].isMain && dist < 3.6;
        const ambientConnection = (pts[i].clusterId === 'ambient' || pts[j].clusterId === 'ambient') && dist < 1.9;

        if ((sameCluster && dist < 1.7) || mainConnection || ambientConnection) {
          conns.push({ p1: i, p2: j, dist });
        }
      }
    }

    return { allPoints: pts, connections: conns, mainNodeIndices: mainIndices };
  }, []);

  const packets = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      return {
        connIndex: i % Math.max(1, connections.length),
        progress: pseudoRandom(i * 17 + 3),
        speed: 0.003 + pseudoRandom(i * 31 + 7) * 0.005,
        color: i % 2 === 0 ? '#38bdf8' : '#2563eb',
      };
    });
  }, [connections]);

  const packetSpheres = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (isReducedMotion) {
      onStateChange?.('STATE: VERIFIED', null);
      return;
    }

    const t1 = setTimeout(() => onStateChange?.('DISCOVERING TOPOLOGY', null), 150);
    const t2 = setTimeout(() => onStateChange?.('MAPPING ENTERPRISE GRID', null), 600);
    const t3 = setTimeout(() => onStateChange?.('SYSTEMS VERIFIED // LIVE', null), 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isReducedMotion, onStateChange]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetScale = Math.min(1.05, Math.max(0.48, viewport.width / 11.5));
    groupRef.current.scale.set(targetScale, targetScale, targetScale);

    if (!isReducedMotion) {
      assemblyTime.current += delta;
      const progress = Math.min(1, assemblyTime.current / 1.5);
      if (Math.abs(assemblyProgress - progress) > 0.05 || progress >= 1) {
        setAssemblyProgress(progress);
      }

      const targetRotX = (mouse.y * 0.07);
      const targetRotY = (mouse.x * 0.12);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.04);
    }

    packets.forEach((p, idx) => {
      const sphere = packetSpheres.current[idx];
      if (!sphere) return;

      p.progress = (p.progress + p.speed) % 1;
      const conn = connections[p.connIndex];
      if (conn) {
        const p1 = allPoints[conn.p1].pos;
        const p2 = allPoints[conn.p2].pos;
        sphere.position.lerpVectors(p1, p2, p.progress);
        sphere.visible = (isReducedMotion ? 1 : assemblyProgress) > 0.5;
      }
    });
  });

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    connections.forEach((conn) => {
      const p1 = allPoints[conn.p1].pos;
      const p2 = allPoints[conn.p2].pos;
      const c1 = allPoints[conn.p1].color;
      const c2 = allPoints[conn.p2].color;

      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);

      colors.push(c1.r, c1.g, c1.b, 0.28);
      colors.push(c2.r, c2.g, c2.b, 0.28);
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    return geo;
  }, [allPoints, connections]);

  const isNarrowScreen = viewport.width < 7;

  return (
    <group ref={groupRef}>
      {/* Line network */}
      <lineSegments geometry={linesGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={isReducedMotion ? 0.2 : Math.max(0, (assemblyProgress - 0.25) * 0.3)}
          linewidth={1}
        />
      </lineSegments>

      {/* Nodes */}
      {allPoints.map((pt, idx) => {
        const isHovered = hoveredCluster === pt.clusterId;
        const effectiveProgress = isReducedMotion ? 1 : assemblyProgress;
        const scale = isReducedMotion
          ? (isHovered ? pt.size * 1.25 : pt.size)
          : Math.min(1, Math.max(0, (effectiveProgress - (idx * 0.02)) * 2)) * (isHovered ? pt.size * 1.25 : pt.size);

        return (
          <group key={idx} position={[pt.pos.x, pt.pos.y, pt.pos.z]}>
            {/* Outer halo */}
            <mesh scale={scale * 1.8}>
              <sphereGeometry args={[1, 14, 14]} />
              <meshBasicMaterial
                color={pt.color}
                transparent
                opacity={isHovered ? 0.22 : isNarrowScreen ? 0.05 : 0.08}
                depthWrite={false}
              />
            </mesh>

            {/* Core sphere */}
            <mesh
              scale={scale}
              onPointerOver={(e) => {
                e.stopPropagation();
                if (pt.isMain) {
                  setHoveredCluster(pt.clusterId);
                  const cl = CLUSTERS.find((c) => c.id === pt.clusterId);
                  onStateChange?.(`INSPECTING: ${cl?.name.toUpperCase()}`, cl?.name || null);
                }
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredCluster(null);
                onStateChange?.('STATE: VERIFIED // LIVE', null);
              }}
            >
              <sphereGeometry args={[1, 18, 18]} />
              <meshBasicMaterial
                color={isHovered ? '#1d4ed8' : pt.color}
                transparent
                opacity={isHovered ? 0.95 : isNarrowScreen ? 0.45 : 0.65}
              />
            </mesh>

            {/* Halo ring for main nodes */}
            {pt.isMain && (
              <mesh scale={scale * 1.4}>
                <ringGeometry args={[0.9, 1.15, 28]} />
                <meshBasicMaterial
                  color={pt.color}
                  transparent
                  opacity={isHovered ? 0.35 : isNarrowScreen ? 0.1 : 0.16}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Flow Packets */}
      {packets.map((pkt, i) => (
        <mesh
          key={`pkt-${i}`}
          ref={(el) => {
            if (el) packetSpheres.current[i] = el;
          }}
          scale={0.04}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={pkt.color} transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
};

export const Hero3DArchitecture: React.FC<{
  onStateChange?: (state: string, activeNodeName: string | null) => void;
}> = ({ onStateChange }) => {
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const isReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  return (
    <div className="relative w-full h-full min-h-[300px] select-none">
      <Canvas
        camera={{ position: [0, 0.1, 6.4], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={1.6} />
        <SceneContent
          onStateChange={onStateChange}
          hoveredCluster={hoveredCluster}
          setHoveredCluster={setHoveredCluster}
          isReducedMotion={isReducedMotion}
        />
      </Canvas>
    </div>
  );
};
export default Hero3DArchitecture;
