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

async function fetchVectors(
  command: string,
  start: Date,
  stop: Date,
  stepSize: string = '1m'
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

  // If HORIZONS says data starts later, retry once from that time
  if (!result.includes('$$SOE')) {
    const earliest = parseEarliestAvailable(result)
    if (earliest && isFinite(earliest.getTime())) {
      const retryStop = new Date(earliest.getTime() + 10 * 60_000)
      return fetchVectors(command, earliest, retryStop, stepSize)
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

  // HORIZONS CSV_FORMAT=YES with VEC_TABLE=2 outputs groups of 2 lines per epoch:
  // Line 1: JDTDB, Calendar Date (TDB), X, Y, Z
  // Line 2: VX, VY, VZ, LT, RG, RR
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const cols1 = lines[i].split(',').map((s) => s.trim())
    const cols2 = lines[i + 1].split(',').map((s) => s.trim())

    const jd = parseFloat(cols1[0])
    const x = parseFloat(cols1[2])
    const y = parseFloat(cols1[3])
    const z = parseFloat(cols1[4])
    const vx = parseFloat(cols2[0])
    const vy = parseFloat(cols2[1])
    const vz = parseFloat(cols2[2])

    if (isNaN(jd) || isNaN(x)) continue

    // JD to Unix ms: (JD - 2440587.5) * 86400 * 1000
    const unixMs = (jd - 2440587.5) * 86400 * 1000
    const time = new Date(unixMs).toISOString()

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
