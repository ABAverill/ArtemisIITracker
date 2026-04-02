@AGENTS.md
# CLAUDE.md — Artemis II Real-Time Mission Tracker

## Project Overview

A Next.js web application that displays the real-time position of NASA's Orion spacecraft during the Artemis II mission. Position data is sourced from the JPL HORIZONS REST API using Orion's spacecraft ID (`-1024`). The app renders an interactive 3D visualization of Orion's trajectory between Earth and the Moon, alongside live telemetry readouts and a mission milestone timeline.

The mission launched April 1, 2026 at 6:35 PM EDT and has approximately 10 days of flight time, making the live tracking window April 1–11, 2026. After mission end (splashdown), the app should gracefully switch to a "mission complete" playback mode using stored trajectory data.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, API routes, easy Vercel deploy |
| Language | TypeScript | Required throughout |
| 3D Visualization | Three.js (`three` + `@react-three/fiber` + `@react-three/drei`) | Full control over space scene |
| Styling | Tailwind CSS | Utility-first, dark space aesthetic |
| Data Fetching | SWR | Client-side polling with stale-while-revalidate |
| State | Zustand | Lightweight global state for telemetry |
| Hosting | Vercel | Serverless API routes, edge caching |

---

## Data Architecture

### Primary Source: JPL HORIZONS REST API

Spacecraft ID: `-1024` (Artemis II / Orion / "Integrity")

**Vector query endpoint:**
```
GET https://ssd.jpl.nasa.gov/api/horizons.api
  ?format=json
  &COMMAND='-1024'
  &EPHEM_TYPE='VECTORS'
  &CENTER='500@399'        // Earth geocenter as origin
  &START_TIME='<now UTC>'
  &STOP_TIME='<now+5min UTC>'
  &STEP_SIZE='1m'
  &VEC_TABLE='2'           // Position + velocity only
  &REF_PLANE='FRAME'
  &REF_SYSTEM='ICRF'
  &VEC_CORR='NONE'
  &OUT_UNITS='KM-S'
  &CSV_FORMAT='YES'
```

The response contains X, Y, Z position in km (geocentric ICRF frame) and VX, VY, VZ velocity in km/s.

**Moon position** (for reference body rendering):
```
COMMAND='301'              // Moon body ID
CENTER='500@399'           // Same Earth-centered frame
```

**Polling interval:** Every 60 seconds via Next.js API route (HORIZONS data updates ~every minute for active spacecraft).

### Secondary Source: NASA AROW State Vectors

NASA publishes downloadable state vector files at:
`https://www.nasa.gov/mission/artemis-ii/track-nasas-artemis-ii-mission-in-real-time/`

These are updated periodically and serve as a fallback / data quality check. Parse as CSV and cache in-memory. Use as fallback if HORIZONS returns an error.

### Derived Data

Compute the following from raw position vectors in the API route before returning to client:

```typescript
interface OrionTelemetry {
  timestamp: string           // ISO UTC
  position: { x: number; y: number; z: number }  // km, geocentric ICRF
  velocity: { vx: number; vy: number; vz: number } // km/s
  distanceFromEarthKm: number     // sqrt(x²+y²+z²)
  distanceFromMoonKm: number      // derived using Moon position
  speedKmPerSec: number           // sqrt(vx²+vy²+vz²)
  missionElapsedSeconds: number   // since launch: 2026-04-01T22:35:00Z
  currentPhase: MissionPhase
}

type MissionPhase =
  | 'earth_orbit'        // MET 0–~6h: two Earth orbits, systems checkout
  | 'tli'                // Trans-Lunar Injection burn
  | 'translunar_coast'   // Coasting to Moon (~4 days)
  | 'lunar_flyby'        // Closest approach + free-return slingshot
  | 'transearth_coast'   // Returning to Earth (~4 days)
  | 'reentry'            // Final hours before splashdown
  | 'complete'           // Post-splashdown
```

---

## Project Structure

```
artemis-tracker/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
│
├── app/
│   ├── layout.tsx              # Root layout, dark theme, metadata
│   ├── page.tsx                # Main tracker page
│   ├── globals.css
│   │
│   └── api/
│       ├── telemetry/
│       │   └── route.ts        # GET: fetches HORIZONS, returns OrionTelemetry JSON
│       └── trajectory/
│           └── route.ts        # GET: returns full historical path (array of positions)
│
├── components/
│   ├── scene/
│   │   ├── SpaceScene.tsx      # R3F Canvas wrapper, camera, lighting
│   │   ├── EarthGlobe.tsx      # Textured Earth sphere
│   │   ├── MoonGlobe.tsx       # Textured Moon sphere, positioned from live data
│   │   ├── OrionSpacecraft.tsx # Glowing point/mesh at Orion's position
│   │   ├── TrajectoryPath.tsx  # Line drawn through historical positions
│   │   └── Stars.tsx           # Starfield background (drei <Stars />)
│   │
│   ├── hud/
│   │   ├── TelemetryPanel.tsx  # Distance, speed, MET readouts
│   │   ├── MilestoneTimeline.tsx # Mission phase + upcoming events
│   │   └── MissionStatus.tsx   # Phase badge + crew names
│   │
│   └── ui/
│       ├── LoadingScreen.tsx
│       └── ErrorBanner.tsx
│
├── hooks/
│   ├── useTelemetry.ts         # SWR polling /api/telemetry every 60s
│   └── useTrajectory.ts        # SWR fetch of full path for rendering
│
├── lib/
│   ├── horizons.ts             # HORIZONS API fetch + parse logic
│   ├── telemetry.ts            # Derive distances, phase, MET from raw vectors
│   ├── coordinates.ts          # ICRF → scene coordinate transforms
│   ├── mission.ts              # Mission constants, milestone definitions
│   └── cache.ts                # In-memory cache for API route responses
│
└── types/
    └── telemetry.ts            # OrionTelemetry, MissionPhase, etc.
```

---

## API Routes

### `GET /api/telemetry`

**Purpose:** Returns the current Orion position and derived telemetry. Called by the client every 60 seconds via SWR.

**Implementation (`app/api/telemetry/route.ts`):**
1. Check in-memory cache — if data is less than 55 seconds old, return cached value immediately (HORIZONS rate limit protection).
2. Call `lib/horizons.ts` → `fetchOrionVectors(now, now+5min)` to get Orion position/velocity.
3. Call `lib/horizons.ts` → `fetchMoonVectors(now, now+5min)` to get Moon position.
4. Call `lib/telemetry.ts` → `deriveMetrics(orionVectors, moonVectors)` to compute distances, speed, phase, MET.
5. Store result in cache with timestamp.
6. Return `OrionTelemetry` as JSON with `Cache-Control: no-store`.

**Error handling:** If HORIZONS returns an error or times out (>10s), fall back to the most recent cached value with a `stale: true` flag. If no cached value exists, return 503 with `{ error: 'No telemetry available' }`.

**Response shape:**
```json
{
  "timestamp": "2026-04-03T14:22:00Z",
  "position": { "x": -123456.7, "y": 45678.9, "z": -12345.6 },
  "velocity": { "vx": -0.234, "vy": 0.891, "vz": -0.123 },
  "distanceFromEarthKm": 145230,
  "distanceFromMoonKm": 237410,
  "speedKmPerSec": 1.12,
  "missionElapsedSeconds": 172800,
  "currentPhase": "translunar_coast",
  "stale": false
}
```

### `GET /api/trajectory`

**Purpose:** Returns the full array of historical positions since launch, used to draw the flight path line in the 3D scene. Called once on page load, then periodically to append new points.

**Implementation:**
1. On first call, query HORIZONS for positions from launch time to now, at 5-minute intervals.
2. Cache the full array in memory. On subsequent calls, only query HORIZONS for the delta since last fetch, append to cache, and return the full array.
3. Response is an array of `{ timestamp, x, y, z }` objects.

**Query:**
```
START_TIME = '2026-04-01T22:35:00'  // Launch time (UTC)
STOP_TIME  = <now UTC>
STEP_SIZE  = '5m'
```

**Note:** On first load this may be a large response (e.g. 1000+ points after several days). The client should render this as a `THREE.BufferGeometry` line, not individual objects.

---

## `lib/horizons.ts` — HORIZONS Integration

```typescript
const HORIZONS_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api'
const ORION_ID = '-1024'
const MOON_ID = '301'
const EARTH_CENTER = '500@399'

interface StateVector {
  time: string
  x: number   // km
  y: number   // km
  z: number   // km
  vx: number  // km/s
  vy: number  // km/s
  vz: number  // km/s
}

export async function fetchOrionVectors(start: Date, stop: Date): Promise<StateVector[]>
export async function fetchMoonVectors(start: Date, stop: Date): Promise<StateVector[]>
```

**Parsing:** HORIZONS returns a text block with `$$SOE` / `$$EOE` delimiters. Extract lines between these markers, parse the CSV columns for JD, X, Y, Z, VX, VY, VZ. Convert JD to ISO UTC using the formula: `UTC = (JD - 2440587.5) * 86400` seconds since Unix epoch.

**CORS:** HORIZONS API does not have CORS restrictions for server-side calls. All HORIZONS calls MUST happen in the API route (server-side), never in the browser.

---

## `lib/coordinates.ts` — Coordinate Transforms

The 3D scene uses a simplified coordinate system where:
- Earth is at the origin `(0, 0, 0)`
- 1 scene unit = 10,000 km
- The Moon is positioned at its real geocentric distance (~384,400 km → ~38.4 scene units)
- Orion is positioned at its actual geocentric coordinates, scaled the same way

```typescript
const SCALE = 1 / 10000  // 1 scene unit = 10,000 km

export function icrfToScene(km: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(km.x * SCALE, km.z * SCALE, -km.y * SCALE)
  // Note: ICRF Y becomes Three.js Z; ICRF Z becomes Three.js Y
  // to orient the Earth-Moon system roughly in the XZ plane
}
```

Earth radius in scene units: `6371 / 10000 = 0.637`
Moon radius in scene units: `1737 / 10000 = 0.174`

---

## `lib/mission.ts` — Mission Constants

```typescript
export const LAUNCH_TIME = new Date('2026-04-01T22:35:00Z')

export const MISSION_PHASES: Array<{
  phase: MissionPhase
  label: string
  startMET: number   // seconds after launch
  endMET: number
  description: string
}> = [
  { phase: 'earth_orbit',      label: 'Earth Orbit Checkout', startMET: 0,      endMET: 21600,  description: 'Two orbits of Earth to verify all systems' },
  { phase: 'tli',              label: 'Trans-Lunar Injection', startMET: 21600,  endMET: 25200,  description: 'ICPS burn sends Orion toward the Moon' },
  { phase: 'translunar_coast', label: 'Translunar Coast',      startMET: 25200,  endMET: 374400, description: '~4 day coast toward the Moon' },
  { phase: 'lunar_flyby',      label: 'Lunar Flyby',           startMET: 374400, endMET: 432000, description: 'Closest approach and free-return slingshot' },
  { phase: 'transearth_coast', label: 'Transearth Coast',      startMET: 432000, endMET: 820800, description: '~4.5 day return journey to Earth' },
  { phase: 'reentry',          label: 'Reentry & Splashdown',  startMET: 820800, endMET: 864000, description: 'Skip reentry at ~25,000 mph' },
]

// Closest approach distance (km) to Moon — for phase boundary detection
export const LUNAR_FLYBY_DISTANCE_KM = 7600
```

**Phase detection:** Derive `currentPhase` from both MET thresholds above AND real distance from Moon. If `distanceFromMoonKm < 20000`, override to `lunar_flyby` regardless of MET.

---

## 3D Scene Specification

### `SpaceScene.tsx`

```tsx
<Canvas
  camera={{ position: [0, 15, 50], fov: 45, near: 0.01, far: 1000 }}
  gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
>
  <ambientLight intensity={0.05} />
  <directionalLight position={[150, 0, 0]} intensity={1.5} />  {/* Sun direction */}
  <Stars radius={300} depth={50} count={5000} factor={4} />
  <EarthGlobe />
  <MoonGlobe position={moonScenePosition} />
  <TrajectoryPath positions={trajectoryScenePositions} />
  <OrionSpacecraft position={orionScenePosition} />
  <OrbitControls enableDamping dampingFactor={0.05} minDistance={1} maxDistance={200} />
</Canvas>
```

### `EarthGlobe.tsx`

Use public domain NASA Blue Marble textures hosted in `/public/textures/`:
- `earth_daymap.jpg` — color map (8192×4096 or smaller)
- `earth_clouds.jpg` — alpha-mapped cloud layer (separate mesh, slightly larger radius)
- `earth_normal.jpg` — normal map for surface detail

Slowly rotate Earth on Y axis: `useFrame(({ clock }) => { mesh.rotation.y = clock.elapsedTime * 0.02 })`

Sphere geometry: `<sphereGeometry args={[0.637, 64, 64]} />`

### `MoonGlobe.tsx`

Position updates live from `telemetry.moonPosition`. Texture: `moon_surface.jpg`.
Sphere geometry: `<sphereGeometry args={[0.174, 32, 32]} />`

### `OrionSpacecraft.tsx`

Render as a small glowing sphere + point light (no 3D model needed — spacecraft is too small to see at scale):

```tsx
<mesh position={scenePosition}>
  <sphereGeometry args={[0.08, 16, 16]} />
  <meshStandardMaterial
    color="#00CFFF"
    emissive="#00CFFF"
    emissiveIntensity={2}
  />
</mesh>
<pointLight position={scenePosition} color="#00CFFF" intensity={0.5} distance={5} />
```

Add a label using `<Html>` from drei showing "Orion" on hover.

### `TrajectoryPath.tsx`

Render historical positions as a `THREE.Line` with a custom `ShaderMaterial` that fades from transparent (oldest) to `#00CFFF` (current position). Use `THREE.BufferGeometry` with a `position` buffer attribute. Update buffer attribute (not geometry) when new points arrive to avoid expensive re-allocation.

---

## HUD Components

### `TelemetryPanel.tsx`

Fixed to bottom-left. Dark glassmorphism card (`bg-black/60 backdrop-blur border border-white/10`).

Display (update every 60s from SWR):

```
DISTANCE FROM EARTH     145,230 km
DISTANCE FROM MOON      237,410 km
CURRENT SPEED           1.12 km/s
MISSION ELAPSED TIME    2d 23h 47m
```

Animate number transitions with a counting effect (no jarring jumps).

### `MilestoneTimeline.tsx`

Vertical timeline, right side. Shows all mission phases. Current phase highlighted in cyan. Completed phases in dim white. Upcoming phases in gray. Show countdown to next milestone.

### `MissionStatus.tsx`

Top bar. Shows:
- Mission name: "Artemis II"
- Live indicator dot (pulsing green) or "STALE DATA" (amber) based on `stale` flag
- Current phase label
- Crew: Wiseman · Glover · Koch · Hansen

---

## State Management (Zustand)

```typescript
// store/telemetryStore.ts
interface TelemetryStore {
  telemetry: OrionTelemetry | null
  trajectory: StateVector[]
  isLoading: boolean
  lastUpdated: Date | null
  setTelemetry: (t: OrionTelemetry) => void
  appendTrajectoryPoints: (pts: StateVector[]) => void
}
```

---

## Polling Strategy

```typescript
// hooks/useTelemetry.ts
const { data, error } = useSWR('/api/telemetry', fetcher, {
  refreshInterval: 60_000,     // poll every 60 seconds
  revalidateOnFocus: true,
  dedupingInterval: 55_000,
  onSuccess: (data) => setTelemetry(data),
})
```

```typescript
// hooks/useTrajectory.ts
const { data } = useSWR('/api/trajectory', fetcher, {
  refreshInterval: 300_000,    // poll every 5 minutes
  revalidateOnFocus: false,
  onSuccess: (data) => appendTrajectoryPoints(data),
})
```

---

## Mission Complete Mode

After splashdown (MET > ~9.5 days or phase === `'complete'`), the app switches to playback mode:
- Banner: "Mission Complete — Artemis II Splashdown [date]"
- A scrubber control appears at the bottom of the scene
- User can drag the scrubber to replay Orion's path through the stored trajectory
- Telemetry panel shows historical values at the scrubbed timestamp
- Live polling stops

---

## Error States

| Condition | UI Behavior |
|---|---|
| HORIZONS API down | Show amber "STALE DATA" badge, display last known telemetry |
| No data at all | Full-screen loading skeleton with mission overview text |
| Pre-launch | Show trajectory preview with countdown to launch |
| Post-mission | Playback mode (see above) |

---

## Environment Variables

```bash
# .env.local — none required for MVP (HORIZONS is public, no key needed)

# Optional: analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# Optional: override mission launch time for testing
NEXT_PUBLIC_MISSION_LAUNCH_UTC=2026-04-01T22:35:00Z

# Optional: override polling intervals (ms) for development
NEXT_PUBLIC_TELEMETRY_POLL_MS=60000
NEXT_PUBLIC_TRAJECTORY_POLL_MS=300000
```

---

## Performance Notes

- The trajectory line after 10 days at 5-min intervals is ~2,880 points — well within WebGL limits. No pagination needed.
- Earth and Moon textures should be served from `/public` and imported as Next.js static assets. Keep them ≤2MB each for fast initial load.
- Three.js canvas should be rendered client-only: wrap in `dynamic(() => import('./SpaceScene'), { ssr: false })` to avoid hydration errors.
- API routes should set `export const runtime = 'nodejs'` (not edge) as HORIZONS parsing is CPU-bound.
- Use `next/font` for the monospace HUD font (JetBrains Mono or Space Mono).

---

## NPM Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "three": "^0.167.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.109.0",
    "swr": "^2.2.5",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/three": "^0.167.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## Visual Design

**Color palette (dark space theme):**
```
Background:   #020510  (near-black blue)
Panel bg:     rgba(0, 10, 30, 0.7)
Border:       rgba(255, 255, 255, 0.08)
Orion accent: #00CFFF  (cyan)
Active phase: #00CFFF
Complete:     #ffffff99
Upcoming:     #ffffff33
Warning:      #F59E0B  (amber, stale data)
Font:         Space Mono (HUD), Inter (labels)
```

All HUD panels use glassmorphism: `bg-black/60 backdrop-blur-md border border-white/10 rounded-xl`.

---

## Known Limitations

1. **HORIZONS update latency:** HORIZONS spacecraft trajectories for active missions are typically updated every few minutes as tracking data is processed. Displayed position may lag real-time by 5–15 minutes. This is normal and should be noted in the UI.

2. **Coordinate accuracy:** The ICRF geocentric frame is accurate but the Three.js scene renders the Earth-Moon system in a simplified orientation. The relative distances are correct; the absolute orientation in space (e.g., pole tilt) is simplified for visual clarity.

3. **Mission end:** HORIZONS will stop updating the `-1024` trajectory after splashdown. The app should detect this (no new data returned) and switch to complete mode automatically.

4. **Post-mission data availability:** NASA states that the full ephemeris will remain available for download after the mission ends. The trajectory route should continue to work for historical playback indefinitely.