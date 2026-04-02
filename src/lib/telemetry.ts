import type { StateVector, OrionTelemetry, MissionPhase } from '@/types/telemetry'
import { LAUNCH_TIME, MISSION_PHASES } from './mission'

export function isValidVector(v: StateVector): boolean {
  return [v.x, v.y, v.z, v.vx, v.vy, v.vz].every((n) => isFinite(n))
}

export function deriveMetrics(
  orion: StateVector,
  moon: StateVector
): Omit<OrionTelemetry, 'stale'> {
  const distanceFromEarthKm = Math.sqrt(orion.x ** 2 + orion.y ** 2 + orion.z ** 2)
  const distanceFromMoonKm = Math.sqrt(
    (orion.x - moon.x) ** 2 + (orion.y - moon.y) ** 2 + (orion.z - moon.z) ** 2
  )
  const speedKmPerSec = Math.sqrt(orion.vx ** 2 + orion.vy ** 2 + orion.vz ** 2)

  const timestamp = orion.time
  const missionElapsedSeconds = Math.max(
    0,
    (new Date(timestamp).getTime() - LAUNCH_TIME.getTime()) / 1000
  )

  let currentPhase: MissionPhase = 'complete'
  for (const p of MISSION_PHASES) {
    if (missionElapsedSeconds >= p.startMET && missionElapsedSeconds < p.endMET) {
      currentPhase = p.phase
      break
    }
  }

  // Override to lunar_flyby if very close to Moon
  if (distanceFromMoonKm < 20000 && currentPhase !== 'complete') {
    currentPhase = 'lunar_flyby'
  }

  return {
    timestamp,
    position: { x: orion.x, y: orion.y, z: orion.z },
    velocity: { vx: orion.vx, vy: orion.vy, vz: orion.vz },
    moonPosition: { x: moon.x, y: moon.y, z: moon.z },
    distanceFromEarthKm,
    distanceFromMoonKm,
    speedKmPerSec,
    missionElapsedSeconds,
    currentPhase,
  }
}
