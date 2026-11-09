'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NodeData {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
}

const NODES: NodeData[] = [
  { id: 'data', name: 'EHR Data Lake', pos: [-2.4, 0.8, 0.2], color: '#38bdf8' },
  { id: 'applications', name: 'FHIR / HL7 Gateway', pos: [-1.0, -0.8, 0.4], color: '#2563eb' },
  { id: 'workflows', name: 'Telemetry Hub', pos: [0.0, 0.1, -0.1], color: '#60a5fa' },
  { id: 'infrastructure', name: 'HIPAA Cloud Core', pos: [1.2, 0.9, -0.3], color: '#6366f1' },
  { id: 'people', name: 'Clinical Workstation', pos: [2.3, -0.5, 0.3], color: '#0ea5e9' },
];

// Biometric DNA & Waveform Stream
const BiometricWaveStream: React.FC = () => {
  const pointsCount = 60;
  const helixRef = useRef<THREE.Points>(null);
  const waveRef2 = useRef<THREE.Points>(null);

  const { pos1, pos2 } = useMemo(() => {
    const p1 = new Float32Array(pointsCount * 3);
    const p2 = new Float32Array(pointsCount * 3);

    for (let i = 0; i < pointsCount; i++) {
      const u = (i / (pointsCount - 1)) * 6.0 - 3.0; // -3.0 to +3.0
      const theta = (i / pointsCount) * Math.PI * 4;

      // Helix strand 1
      p1[i * 3] = u;
      p1[i * 3 + 1] = Math.sin(theta) * 0.45 + Math.sin(u * 1.5) * 0.2;
      p1[i * 3 + 2] = Math.cos(theta) * 0.45;

      // Helix strand 2 (opposite phase)
      p2[i * 3] = u;
      p2[i * 3 + 1] = Math.sin(theta + Math.PI) * 0.45 + Math.sin(u * 1.5) * 0.2;
      p2[i * 3 + 2] = Math.cos(theta + Math.PI) * 0.45;
    }
    return { pos1: p1, pos2: p2 };
  }, [pointsCount]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (helixRef.current) {
      helixRef.current.rotation.x = t * 0.2;
    }
    if (waveRef2.current) {
      waveRef2.current.rotation.x = t * 0.2;
    }
  });

  return (
    <group>
      <points ref={helixRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pos1, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#38bdf8" transparent opacity={0.65} />
      </points>

      <points ref={waveRef2}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pos2, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#6366f1" transparent opacity={0.65} />
      </points>
    </group>
  );
};

// Flowing Energy Packets connecting clinical nodes
const CyberLinesAndPackets: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  const lineMeshRef = useRef<THREE.LineSegments>(null);
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const count = 18;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { geometry } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const center = new THREE.Vector3(0.0, 0.1, -0.1);

    NODES.forEach((n) => {
      pts.push(new THREE.Vector3(...n.pos), center);
    });

    for (let i = 0; i < NODES.length - 1; i++) {
      pts.push(new THREE.Vector3(...NODES[i].pos));
      pts.push(new THREE.Vector3(...NODES[i + 1].pos));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return { geometry: geo };
  }, []);

  const paths = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const fromNode = NODES[i % NODES.length];
      const toNode = NODES[(i + 1) % NODES.length];
      return {
        from: new THREE.Vector3(...fromNode.pos),
        to: new THREE.Vector3(...toNode.pos),
        speed: 0.2 + (i % 4) * 0.07,
        progress: i / count,
      };
    });
  }, [count]);

  useFrame((_, delta) => {
    if (!packetsRef.current) return;
    paths.forEach((p, idx) => {
      p.progress = (p.progress + delta * p.speed) % 1;
      dummy.position.lerpVectors(p.from, p.to, p.progress);
      dummy.scale.setScalar(0.045);
      dummy.updateMatrix();
      packetsRef.current!.setMatrixAt(idx, dummy.matrix);
    });
    packetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments ref={lineMeshRef} geometry={geometry}>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </lineSegments>

      <instancedMesh ref={packetsRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </instancedMesh>
    </group>
  );
};

// 3D Central Telemetry Core
const CentralCore: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.4;
      coreRef.current.rotation.y += delta * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.25;
    }
  });

  return (
    <group position={[0.0, 0.1, -0.1]}>
      {/* 3D Wireframe Core */}
      <mesh ref={coreRef} scale={0.4}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#2563eb"
          wireframe
          transparent
          opacity={0.8}
          emissive="#3b82f6"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Orbiting Halo */}
      <mesh ref={ringRef} scale={0.7}>
        <ringGeometry args={[0.9, 1, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const HealthcareScene: React.FC<{
  activeIndex: number;
  onSelectNode: (idx: number) => void;
}> = ({ activeIndex, onSelectNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.14;
      groupRef.current.rotation.x = Math.cos(t * 0.2) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <BiometricWaveStream />
      <CentralCore activeIndex={activeIndex} />
      <CyberLinesAndPackets activeIndex={activeIndex} />

      {/* 5 Interactive Clinical Constellation Nodes */}
      {NODES.map((node, i) => {
        const isSelected = activeIndex === i;
        const isHovered = hoveredIdx === i;

        return (
          <group key={node.id} position={node.pos}>
            {(isSelected || isHovered) && (
              <mesh scale={0.48}>
                <ringGeometry args={[0.7, 1.1, 32]} />
                <meshBasicMaterial
                  color={node.color}
                  transparent
                  opacity={0.7}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            <mesh
              scale={isSelected ? 0.26 : 0.18}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredIdx(i);
              }}
              onPointerOut={() => setHoveredIdx(null)}
              onClick={() => onSelectNode(i)}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial
                color={isSelected ? '#2563eb' : node.color}
                emissive={isSelected ? '#3b82f6' : '#0284c7'}
                emissiveIntensity={isSelected ? 0.9 : 0.35}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Healthcare3DNetwork: React.FC<{
  activeStep: number;
  setActiveStep: (idx: number) => void;
}> = ({ activeStep, setActiveStep }) => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full cursor-pointer"
      >
        <ambientLight intensity={1.4} />
        <pointLight position={[5, 5, 5]} intensity={1.8} />
        <pointLight position={[-5, -5, -5]} color="#38bdf8" intensity={1.2} />
        <HealthcareScene activeIndex={activeStep} onSelectNode={setActiveStep} />
      </Canvas>
    </div>
  );
};
export default Healthcare3DNetwork;
