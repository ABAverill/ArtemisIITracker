import type { StateVector } from '@/types/telemetry'

const HORIZONS_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api'
const ORION_ID = '-1024'
const MOON_ID = '301'
const EARTH_CENTER = '500@399'

function formatDate(d: Date): string {
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

// Parse "No ephemeris for target ... prior to A.D. YYYY-MON-DD HH:MM:SS.#### TDB"
// Returns the first-available Date, or null if not that kind of error.
// HORIZONS emits the month in uppercase (e.g. APR), so we normalise to lowercase
// before the MONTH_MAP lookup.
function parseEarliestAvailable(result: string): Date | null {
  const match = result.match(/prior to A\.D\.\s+(\d{4}-\w{3}-\d{2}\s+\d{2}:\d{2}:\d{2})/i)
  if (!match) return null

  // Build a proper ISO-8601 UTC string so new Date() doesn't apply local offset.
  // Input:  "2026-APR-02 01:58:32"
  // Output: "2026-04-02T01:58:32Z"
  const isoStr = match[1]
    .replace(/-(\w{3})-/, (_, m) => {
      const num = MONTH_MAP[m.toLowerCase()]
      return num ? `-${num}-` : `-${m}-`
    })
    .replace(' ', 'T') + 'Z'

  const d = new Date(isoStr)
  return isFinite(d.getTime()) ? d : null
}

/** Seconds after HORIZONS "prior to … TDB" time before START_TIME is accepted (first tabulated step is often ~1–2 min later). */
const EARLIEST_EPHEM_BUFFER_SEC = 120

async function fetchVectors(
  command: string,
  start: Date,
  stop: Date,
  stepSize: string = '1m',
  retryDepth: number = 0
): Promise<StateVector[]> {
  const effectiveStart = start > stop ? stop : start
  const effectiveStop = new Date(Math.max(stop.getTime(), effectiveStart.getTime() + 60_000))

  const params = new URLSearchParams({
    format: 'json',
    COMMAND: command,
    EPHEM_TYPE: 'VECTORS',
    CENTER: EARTH_CENTER,
    START_TIME: `'${formatDate(effectiveStart)}'`,
    STOP_TIME: `'${formatDate(effectiveStop)}'`,
    STEP_SIZE: `'${stepSize}'`,
    VEC_TABLE: '2',
    REF_PLANE: 'FRAME',
    REF_SYSTEM: 'ICRF',
    VEC_CORR: 'NONE',
    OUT_UNITS: 'KM-S',
    CSV_FORMAT: 'YES',
  })

  const url = `${HORIZONS_BASE}?${params.toString()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`HORIZONS HTTP ${res.status}`)

  const json = await res.json()
  const result: string = json.result ?? ''

  // If HORIZONS says data starts later, retry from just past that boundary
  if (!result.includes('$$SOE')) {
    const earliest = parseEarliestAvailable(result)
    if (earliest && isFinite(earliest.getTime()) && retryDepth < 4) {
      const retryStart = new Date(earliest.getTime() + EARLIEST_EPHEM_BUFFER_SEC * 1000)
      const retryStop = new Date(retryStart.getTime() + 10 * 60_000)
      return fetchVectors(command, retryStart, retryStop, stepSize, retryDepth + 1)
    }
    return []
  }

  return parseHorizonsCSV(result)
}

function parseHorizonsCSV(text: string): StateVector[] {
  const soeIndex = text.indexOf('$$SOE')
  const eoeIndex = text.indexOf('$$EOE')
  if (soeIndex === -1 || eoeIndex === -1) return []

  const block = text.slice(soeIndex + 5, eoeIndex).trim()
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

  const vectors: StateVector[] = []

  // HORIZONS CSV_FORMAT=YES + VEC_TABLE=2 is usually one line per epoch:
  //   JDTDB, Calendar Date (TDB), X, Y, Z, VX, VY, VZ, ...
  // Some targets still use two lines (position then VX,VY,VZ,LT,RG,RR).
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((s) => s.trim())
    const jd = parseFloat(cols[0])
    if (!Number.isFinite(jd) || jd < 2_400_000) continue

    const x = parseFloat(cols[2])
    const y = parseFloat(cols[3])
    const z = parseFloat(cols[4])
    if (![x, y, z].every(Number.isFinite)) continue

    const unixMs = (jd - 2440587.5) * 86400 * 1000
    const time = new Date(unixMs).toISOString()

    let vx: number
    let vy: number
    let vz: number

    const inlineVel =
      cols.length >= 8 &&
      [cols[5], cols[6], cols[7]].every((c) => Number.isFinite(parseFloat(c)))

    if (inlineVel) {
      vx = parseFloat(cols[5])
      vy = parseFloat(cols[6])
      vz = parseFloat(cols[7])
    } else {
      const next = lines[i + 1]
      if (!next) continue
      const nc = next.split(',').map((s) => s.trim())
      vx = parseFloat(nc[0])
      vy = parseFloat(nc[1])
      vz = parseFloat(nc[2])
      if (![vx, vy, vz].every(Number.isFinite)) continue
      // Next epoch lines start with ~2.46e6 JD; velocity km/s is much smaller.
      if (Math.abs(vx) > 1_000_000) continue
      i += 1
    }

    if (![vx, vy, vz].every(Number.isFinite)) continue
    vectors.push({ time, x, y, z, vx, vy, vz })
  }

  return vectors
}

export async function fetchOrionVectors(start: Date, stop: Date): Promise<StateVector[]> {
  return fetchVectors(`'${ORION_ID}'`, start, stop, '1m')
}

export async function fetchMoonVectors(start: Date, stop: Date): Promise<StateVector[]> {
  return fetchVectors(MOON_ID, start, stop, '1m')
}

export async function fetchOrionTrajectory(start: Date, stop: Date): Promise<StateVector[]> {
  return fetchVectors(`'${ORION_ID}'`, start, stop, '5m')
}
