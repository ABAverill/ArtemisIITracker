'use client'
import { useRef, useState } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position: THREE.Vector3
}

export function OrionSpacecraft({ position }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const pulseRef = useRef(0)

  useFrame(({ clock }) => {
    pulseRef.current = clock.elapsedTime
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(pulseRef.current * 2) * 0.5
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#00CFFF"
          emissive="#00CFFF"
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight color="#00CFFF" intensity={0.5} distance={5} />
      {hovered && (
        <Html distanceFactor={10} center>
          <div style={{
            background: 'rgba(0,10,30,0.85)',
            border: '1px solid rgba(0,207,255,0.4)',
            borderRadius: 6,
            padding: '4px 8px',
            color: '#00CFFF',
            fontFamily: 'monospace',
            fontSize: 11,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}>
            Orion (Artemis II)
          </div>
        </Html>
      )}
    </group>
  )
}
