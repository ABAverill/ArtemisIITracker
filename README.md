# Artemis II Mission Tracker

A real-time 3D web application that tracks NASA's Orion spacecraft during the Artemis II mission. Live position data is sourced directly from the [JPL HORIZONS REST API](https://ssd.jpl.nasa.gov/horizons/) using Orion's spacecraft ID (`-1024`).

## Features

- **Live 3D visualization** — Interactive Three.js scene with Earth, Moon, and Orion rendered at true geocentric scale
- **Real telemetry** — Position, velocity, and distance data polled every 60 seconds from JPL HORIZONS
- **Trajectory path** — Actual tracked flight path rendered as a glowing cyan line; full planned free-return trajectory shown as a ghost overlay
- **Mission HUD** — Distance from Earth/Moon, current speed, live mission elapsed time, and phase timeline with countdown
- **2D mission map** — Top-down ICRF projection card showing Earth, Moon, Orion, and both planned/actual paths
- **Camera controls** — Orbit, zoom, tilt, and one-click recenter to the Earth–Moon midpoint
- **Graceful fallbacks** — Stale-data banner when HORIZONS is unreachable; pre-tracking gap handled automatically with retry logic

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| 3D | Three.js · @react-three/fiber · @react-three/drei |
| Styling | Tailwind CSS v4 |
| Data fetching | SWR |
| State | Zustand |
| Data source | JPL HORIZONS REST API (public, no key required) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/your-username/artemis-ii-tracker.git
cd artemis-ii-tracker
npm install
```

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building for production

```bash
npm run build
npm start
```

## Environment Variables

No environment variables are required — the JPL HORIZONS API is public and unauthenticated.

Optional overrides (copy `.env.example` to `.env.local`):

```bash
# Override the mission launch time for local testing
NEXT_PUBLIC_MISSION_LAUNCH_UTC=2026-04-01T22:35:00Z

# Reduce polling intervals during development (milliseconds)
NEXT_PUBLIC_TELEMETRY_POLL_MS=60000
NEXT_PUBLIC_TRAJECTORY_POLL_MS=300000

# Plausible Analytics domain (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

## Architecture

```
Browser                          Server (Next.js API routes)
────────────────────────────     ──────────────────────────────────
useTelemetry (SWR, 60s) ──────▶ /api/telemetry
  → Zustand store                │  fetchOrionVectors  ──▶ JPL HORIZONS
  → SpaceScene (Three.js)        │  fetchMoonVectors   ──▶ JPL HORIZONS
  → TelemetryPanel (HUD)         │  deriveMetrics
  → MiniMap (SVG)                │  in-memory cache (55s TTL)
                                  │  stale fallback on error
useTrajectory (SWR, 5m) ──────▶ /api/trajectory
  → TrajectoryPath (Three.js)    │  fetchOrionTrajectory ──▶ JPL HORIZONS
  → MiniMap (SVG)                │  incremental delta fetch
                                  │  in-memory cache (4m TTL)
```

**Coordinate system:** All HORIZONS data is in geocentric ICRF (X, Y, Z in km). The 3D scene maps `1 scene unit = 10,000 km`, with ICRF Y → scene Z (negated) to orient the Earth–Moon system in the XZ plane. The 2D map uses raw ICRF X/Y for a top-down view.

**Pre-tracking gap:** HORIZONS tracking data for Orion begins a few hours after launch (ground station acquisition). The API routes detect the `"No ephemeris prior to …"` error, parse the earliest available timestamp, and automatically retry from that point.

## Data Source

**JPL HORIZONS** (`https://ssd.jpl.nasa.gov/api/horizons.api`) — primary source for Orion position/velocity vectors and Moon ephemeris.

- Spacecraft ID: `-1024` (Artemis II / Orion)
- Moon ID: `301`
- Reference frame: Geocentric ICRF
- No API key required
- All HORIZONS calls are server-side; the browser never contacts JPL directly

## Deploying to Vercel

```bash
npx vercel
```

> **Note:** API routes use `runtime = 'nodejs'` (HORIZONS response parsing is CPU-bound) and are not compatible with the Edge runtime.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout, Space Mono font, dark theme
│   ├── page.tsx                 # Main page — HUD overlays + 3D scene
│   └── api/
│       ├── telemetry/route.ts   # GET: current position + derived metrics
│       └── trajectory/route.ts  # GET: full historical flight path
├── components/
│   ├── scene/                   # Three.js / R3F components (Canvas-side)
│   │   ├── SpaceScene.tsx       # Canvas, lighting, OrbitControls
│   │   ├── EarthGlobe.tsx
│   │   ├── MoonGlobe.tsx
│   │   ├── OrionSpacecraft.tsx
│   │   ├── TrajectoryPath.tsx   # Actual HORIZONS path (cyan line)
│   │   ├── PlannedTrajectory.tsx # Ghost free-return arc
│   │   └── CameraController.tsx # Registers camera actions in store
│   ├── hud/                     # DOM overlay components
│   │   ├── MissionStatus.tsx    # Top bar: phase, crew, live indicator
│   │   ├── TelemetryPanel.tsx   # Bottom-left: distances, speed, MET
│   │   ├── MilestoneTimeline.tsx # Right: phase timeline + countdown
│   │   ├── MiniMap.tsx          # Bottom-right: 2D SVG map
│   │   └── CameraControlPanel.tsx # Top-left: orbit/zoom/recenter buttons
│   └── ui/
│       ├── LoadingScreen.tsx
│       └── ErrorBanner.tsx
├── hooks/
│   ├── useTelemetry.ts          # SWR polling → telemetry store
│   └── useTrajectory.ts         # SWR polling → trajectory store
├── lib/
│   ├── horizons.ts              # JPL HORIZONS API client + CSV parser
│   ├── telemetry.ts             # Derive distances, speed, phase
│   ├── coordinates.ts           # ICRF → Three.js scene transform
│   ├── mission.ts               # Launch time, phase definitions, MET
│   └── cache.ts                 # In-memory TTL cache for API routes
├── store/
│   ├── telemetryStore.ts        # Zustand: telemetry + trajectory state
│   └── cameraStore.ts           # Zustand: camera action callbacks
└── types/
    └── telemetry.ts             # OrionTelemetry, StateVector, MissionPhase
```

## Mission Timeline

| Phase | MET | Description |
|---|---|---|
| Earth Orbit Checkout | T+0h → T+6h | Two orbits, systems verification |
| Trans-Lunar Injection | T+6h → T+7h | ICPS burn toward the Moon |
| Translunar Coast | T+7h → T+4d 8h | ~4-day coast |
| Lunar Flyby | T+4d 8h → T+5d | Closest approach (~7,600 km altitude) |
| Transearth Coast | T+5d → T+9d 12h | Return journey |
| Reentry & Splashdown | T+9d 12h+ | Skip reentry at ~25,000 mph |

## Known Limitations

- HORIZONS tracking data for Orion becomes available a few hours after launch (ground station acquisition delay). The displayed position may lag real-time by 5–15 minutes — this is noted in the UI.
- The planned trajectory arc is a visual approximation of the free-return path, not the precise ephemeris.
- The 3D scene renders the Earth–Moon system in a simplified ICRF orientation. Relative distances are accurate; axial tilt is not modelled.

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

## License

MIT — see [LICENSE](LICENSE).
