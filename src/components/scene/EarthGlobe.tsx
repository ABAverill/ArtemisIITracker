'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS_SCENE } from '@/lib/coordinates'

export function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.02
    }
  })

  return (
    <group>
      {/* Core Earth sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS_SCENE, 64, 64]} />
        <meshStandardMaterial
          color="#1a6db5"
          emissive="#0a2a4a"
          emissiveIntensity={0.3}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS_SCENE * 1.06, 32, 32]} />
        <meshStandardMaterial
          color="#4a9eff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Label */}
      <Html
        position={[0, EARTH_RADIUS_SCENE + 0.4, 0]}
        center
        distanceFactor={12}
        occlude={false}
      >
        <div style={{
          color: 'rgba(74,158,255,0.75)',
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px rgba(74,158,255,0.4)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          Earth
        </div>
      </Html>
    </group>
  )
}
