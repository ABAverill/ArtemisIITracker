'use client'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { MOON_RADIUS_SCENE } from '@/lib/coordinates'

interface Props {
  position: THREE.Vector3
}

export function MoonGlobe({ position }: Props) {
  return (
    <group position={position}>
      {/* Moon surface */}
      <mesh>
        <sphereGeometry args={[MOON_RADIUS_SCENE, 32, 32]} />
        <meshStandardMaterial
          color="#a0968a"
          roughness={0.95}
          metalness={0.0}
          emissive="#604030"
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[MOON_RADIUS_SCENE * 1.35, 16, 16]} />
        <meshStandardMaterial
          color="#c8b89a"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Permanent label */}
      <Html
        position={[0, MOON_RADIUS_SCENE + 0.4, 0]}
        center
        distanceFactor={12}
        occlude={false}
      >
        <div style={{
          color: 'rgba(200,184,154,0.85)',
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px rgba(200,184,154,0.4)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          Moon
        </div>
      </Html>
    </group>
  )
}
