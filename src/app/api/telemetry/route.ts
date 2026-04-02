import { fetchOrionVectors, fetchMoonVectors } from '@/lib/horizons'
import { deriveMetrics, isValidVector } from '@/lib/telemetry'
import { getCached, setCached, getCachedAny } from '@/lib/cache'
import type { OrionTelemetry } from '@/types/telemetry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'telemetry'
const CACHE_MAX_AGE_MS = 55_000

export async function GET() {
  const cached = getCached<OrionTelemetry>(CACHE_KEY, CACHE_MAX_AGE_MS)
  if (cached) {
    return Response.json(cached)
  }

  try {
    const now = new Date()
    const stop = new Date(now.getTime() + 5 * 60 * 1000)

    const [orionVectors, moonVectors] = await Promise.all([
      fetchOrionVectors(now, stop),
      fetchMoonVectors(now, stop),
    ])

    const orion = orionVectors.find(isValidVector)
    const moon = moonVectors.find(isValidVector)

    if (!orion || !moon) {
      throw new Error('No valid vectors returned from HORIZONS')
    }
    const metrics = deriveMetrics(orion, moon)
    const telemetry: OrionTelemetry = { ...metrics, stale: false }

    setCached(CACHE_KEY, telemetry)
    return Response.json(telemetry)
  } catch {
    const stale = getCachedAny<OrionTelemetry>(CACHE_KEY)
    if (stale) {
      return Response.json({ ...stale, stale: true })
    }
    return Response.json({ error: 'No telemetry available' }, { status: 503 })
  }
}
