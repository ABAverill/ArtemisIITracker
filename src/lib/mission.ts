import type { MissionPhase } from '@/types/telemetry'

export const LAUNCH_TIME = new Date('2026-04-01T22:35:00Z')

export const MISSION_PHASES: Array<{
  phase: MissionPhase
  label: string
  startMET: number
  endMET: number
  description: string
}> = [
  { phase: 'earth_orbit', label: 'Earth Orbit Checkout', startMET: 0, endMET: 21600, description: 'Two orbits of Earth to verify all systems' },
  { phase: 'tli', label: 'Trans-Lunar Injection', startMET: 21600, endMET: 25200, description: 'ICPS burn sends Orion toward the Moon' },
  { phase: 'translunar_coast', label: 'Translunar Coast', startMET: 25200, endMET: 374400, description: '~4 day coast toward the Moon' },
  { phase: 'lunar_flyby', label: 'Lunar Flyby', startMET: 374400, endMET: 432000, description: 'Closest approach and free-return slingshot' },
  { phase: 'transearth_coast', label: 'Transearth Coast', startMET: 432000, endMET: 820800, description: '~4.5 day return journey to Earth' },
  { phase: 'reentry', label: 'Reentry & Splashdown', startMET: 820800, endMET: 864000, description: 'Skip reentry at ~25,000 mph' },
]

export const LUNAR_FLYBY_DISTANCE_KM = 7600

export function getMETString(seconds: number): string {
  if (!isFinite(seconds)) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}
