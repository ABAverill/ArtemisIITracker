'use client'
import { useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EarthGlobe } from './EarthGlobe'
import { MoonGlobe } from './MoonGlobe'
import { OrionSpacecraft } from './OrionSpacecraft'
import { TrajectoryPath } from './TrajectoryPath'
import { PlannedTrajectory } from './PlannedTrajectory'
import { CameraController } from './CameraController'
import { icrfToScene } from '@/lib/coordinates'
import { useTelemetryStore } from '@/store/telemetryStore'

// Default Moon position (scene units) before telemetry arrives.
// Used to centre the camera and orbit target on first load.
const DEFAULT_MOON = new THREE.Vector3(38.4, 0, 0)
const DEFAULT_MID  = DEFAULT_MOON.clone().multiplyScalar(0.5) // [19.2, 0, 0]

export function SpaceScene() {
  const telemetry  = useTelemetryStore((s) => s.telemetry)
  const trajectory = useTelemetryStore((s) => s.trajectory)

  const controlsRef      = useRef<OrbitControlsImpl>(null)
  const targetInitialized = useRef(false)

  const moonPos = telemetry
    ? icrfToScene(telemetry.moonPosition)
    : DEFAULT_MOON.clone()

  const orionPos = telemetry
    ? icrfToScene(telemetry.position)
    : new THREE.Vector3(1.5, 0, 0)

  // Once real telemetry arrives, shift the orbit pivot to the true midpoint
  // exactly once so subsequent user interaction isn't disrupted.
  useEffect(() => {
    if (controlsRef.current && telemetry && !targetInitialized.current) {
      const mid = moonPos.clone().multiplyScalar(0.5)
      controlsRef.current.target.copy(mid)
      controlsRef.current.update()
      targetInitialized.current = true
    }
  })

  return (
    <Canvas
      camera={{
        // Position the camera above and behind the default midpoint
        // so both Earth and Moon are in frame on first load.
        position: [DEFAULT_MID.x, 30, 95],
        fov: 60,
        near: 0.01,
        far: 1000,
      }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ background: '#020510' }}
    >
      <ambientLight intensity={0.05} />
      <directionalLight position={[150, 0, 0]} intensity={1.5} />

      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade />

      <EarthGlobe />
      <MoonGlobe position={moonPos} />

      <PlannedTrajectory moonPos={moonPos} />
      <TrajectoryPath trajectory={trajectory} />
      <OrionSpacecraft position={orionPos} />

      {/* Registers camera actions in cameraStore for the DOM control panel */}
      <CameraController />

      <OrbitControls
        ref={controlsRef}
        // Default pivot at the midpoint — updated imperatively once telemetry loads
        target={[DEFAULT_MID.x, DEFAULT_MID.y, DEFAULT_MID.z]}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={300}
        makeDefault
      />
    </Canvas>
  )
}
