import { fetchOrionTrajectory } from '@/lib/horizons'
import { getCached, setCached, getCachedAny } from '@/lib/cache'
import { LAUNCH_TIME } from '@/lib/mission'
import type { StateVector } from '@/types/telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'trajectory'
const LAST_FETCH_KEY = 'trajectory_last_fetch'
const CACHE_MAX_AGE_MS = 4 * 60 * 1000

export async function GET() {
  const cached = getCached<StateVector[]>(CACHE_KEY, CACHE_MAX_AGE_MS)
  if (cached) {
    return Response.json(cached)
  }

  try {
    const now = new Date()
    const lastFetch = getCachedAny<Date>(LAST_FETCH_KEY)
    const start = lastFetch ? new Date(lastFetch) : LAUNCH_TIME
    const newPoints = await fetchOrionTrajectory(start, now)

    const existing = getCachedAny<StateVector[]>(CACHE_KEY) ?? []
    const merged = mergeTrajectory(existing, newPoints)

    setCached(CACHE_KEY, merged)
    setCached(LAST_FETCH_KEY, now)

    return Response.json(merged)
  } catch {
    const stale = getCachedAny<StateVector[]>(CACHE_KEY)
    if (stale) return Response.json(stale)
    return Response.json([], { status: 200 })
  }
}

function mergeTrajectory(existing: StateVector[], incoming: StateVector[]): StateVector[] {
  if (existing.length === 0) return incoming
  const lastTime = existing[existing.length - 1].time
  const newPts = incoming.filter((p) => p.time > lastTime)
  return [...existing, ...newPts]
}
