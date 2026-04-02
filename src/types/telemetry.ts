export type MissionPhase =
  | 'earth_orbit'
  | 'tli'
  | 'translunar_coast'
  | 'lunar_flyby'
  | 'transearth_coast'
  | 'reentry'
  | 'complete'

export interface StateVector {
  time: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export interface OrionTelemetry {
  timestamp: string
  position: { x: number; y: number; z: number }
  velocity: { vx: number; vy: number; vz: number }
  moonPosition: { x: number; y: number; z: number }
  distanceFromEarthKm: number
  distanceFromMoonKm: number
  speedKmPerSec: number
  missionElapsedSeconds: number
  currentPhase: MissionPhase
  stale: boolean
}
