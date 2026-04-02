'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useTelemetryStore } from '@/store/telemetryStore'

// ── Layout ──────────────────────────────────────────────────────────────────
const W = 260
const H = 210
const CX = W / 2
const CY = H / 2

// Scale: Moon at ~384,400 km maps to 78% of the shortest half-dimension
const MOON_DIST_KM = 384400
const SCALE = (Math.min(CX, CY) * 0.78) / MOON_DIST_KM // px per km

// ── Coordinate helpers ───────────────────────────────────────────────────────
// ICRF X → SVG X (right), ICRF Y → SVG Y (up, so negate for SVG)
function pt(xKm: number, yKm: number): string {
  return `${(CX + xKm * SCALE).toFixed(1)},${(CY - yKm * SCALE).toFixed(1)}`
}
function xy(xKm: number, yKm: number): [number, number] {
  return [CX + xKm * SCALE, CY - yKm * SCALE]
}

// ── Planned free-return trajectory (same shape as PlannedTrajectory.tsx) ─────
function buildPlanned(mx: number, my: number): string {
  const moonDist = Math.sqrt(mx * mx + my * my)
  if (moonDist < 1000) return ''

  const mdx = mx / moonDist
  const mdy = my / moonDist
  const px = -mdy          // perpendicular
  const py = mdx
  const flyby = 9337       // km from Moon centre at closest approach

  const wps = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(mdx * moonDist * 0.22 + px * moonDist * 0.07,  mdy * moonDist * 0.22 + py * moonDist * 0.07,  0),
    new THREE.Vector3(mdx * moonDist * 0.55 + px * moonDist * 0.055, mdy * moonDist * 0.55 + py * moonDist * 0.055, 0),
    new THREE.Vector3(mdx * moonDist * 0.82 + px * moonDist * 0.025, mdy * moonDist * 0.82 + py * moonDist * 0.025, 0),
    new THREE.Vector3(mx - mdx * flyby * 1.1, my - mdy * flyby * 1.1, 0),  // approach Moon
    new THREE.Vector3(mx + px  * flyby,        my + py  * flyby,        0), // closest point
    new THREE.Vector3(mx + mdx * flyby * 1.1, my + mdy * flyby * 1.1, 0),  // depart Moon
    new THREE.Vector3(mdx * moonDist * 0.82 - px * moonDist * 0.025, mdy * moonDist * 0.82 - py * moonDist * 0.025, 0),
    new THREE.Vector3(mdx * moonDist * 0.55 - px * moonDist * 0.055, mdy * moonDist * 0.55 - py * moonDist * 0.055, 0),
    new THREE.Vector3(mdx * moonDist * 0.22 - px * moonDist * 0.07,  mdy * moonDist * 0.22 - py * moonDist * 0.07,  0),
    new THREE.Vector3(0, 0, 0),
  ]

  const curve = new THREE.CatmullRomCurve3(wps, false, 'catmullrom', 0.5)
  return curve.getPoints(240).map(p => pt(p.x, p.y)).join(' ')
}

// ── Component ────────────────────────────────────────────────────────────────
export function MiniMap() {
  const telemetry  = useTelemetryStore(s => s.telemetry)
  const trajectory = useTelemetryStore(s => s.trajectory)

  // Fall back to a 45° default Moon position when no telemetry yet
  const moonX  = telemetry?.moonPosition.x ?? MOON_DIST_KM * 0.707
  const moonY  = telemetry?.moonPosition.y ?? MOON_DIST_KM * 0.707
  const orionX = telemetry?.position.x ?? 0
  const orionY = telemetry?.position.y ?? 0

  const [moonSX,  moonSY]  = xy(moonX,  moonY)
  const [orionSX, orionSY] = xy(orionX, orionY)

  // Label placement — flip to opposite side if too close to the edge
  const moonLabelX  = moonSX  > W * 0.6 ? moonSX  - 34 : moonSX  + 7
  const orionLabelX = orionSX > W * 0.6 ? orionSX - 34 : orionSX + 7
  const orionLabelY = orionSY < 16 ? orionSY + 14 : orionSY - 6

  const plannedPts = useMemo(() => buildPlanned(moonX, moonY), [moonX, moonY])

  const actualPts = useMemo(
    () => trajectory.map(p => pt(p.x, p.y)).join(' '),
    [trajectory]
  )

  return (
    <div
      className="fixed bottom-4 right-4 z-30 rounded-xl overflow-hidden select-none"
      style={{
        background: 'rgba(0,10,30,0.78)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase border-b border-white/5 text-white/25 flex justify-between items-center">
        <span>Mission Map</span>
        <span className="text-white/15 normal-case tracking-normal">top-down · ICRF</span>
      </div>

      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* Distance rings at 25 / 50 / 75 / 100% of Earth-Moon distance */}
        {[0.25, 0.5, 0.75, 1.0].map(frac => (
          <circle
            key={frac}
            cx={CX} cy={CY}
            r={MOON_DIST_KM * frac * SCALE}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
        ))}

        {/* Faint dashed Earth-Moon axis */}
        <line
          x1={CX} y1={CY} x2={moonSX} y2={moonSY}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
          strokeDasharray="2 5"
        />

        {/* ── Planned trajectory ghost ── */}
        {plannedPts && (
          <polyline
            points={plannedPts}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
        )}

        {/* ── Actual HORIZONS trajectory ── */}
        {trajectory.length >= 2 && (
          <polyline
            points={actualPts}
            fill="none"
            stroke="#00CFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
        )}

        {/* ── Earth ── */}
        <circle cx={CX} cy={CY} r={6}   fill="#1a6db5" />
        <circle cx={CX} cy={CY} r={9}   fill="none" stroke="#4a9eff" strokeWidth={1} opacity={0.3} />
        <circle cx={CX} cy={CY} r={13}  fill="none" stroke="#4a9eff" strokeWidth={0.5} opacity={0.12} />
        <text x={CX + 11} y={CY + 4} fill="rgba(74,158,255,0.7)" fontSize={8} fontFamily="monospace" letterSpacing="0.08em">
          EARTH
        </text>

        {/* ── Moon ── */}
        <circle cx={moonSX} cy={moonSY} r={4}   fill="#a0968a" />
        <circle cx={moonSX} cy={moonSY} r={6.5} fill="none" stroke="#c8b89a" strokeWidth={1} opacity={0.3} />
        <text x={moonLabelX} y={moonSY + 4} fill="rgba(200,184,154,0.7)" fontSize={8} fontFamily="monospace" letterSpacing="0.08em">
          MOON
        </text>

        {/* ── Orion / Artemis II ── */}
        {/* Glow */}
        <circle cx={orionSX} cy={orionSY} r={7} fill="rgba(0,207,255,0.08)" />
        {/* Dot */}
        <circle cx={orionSX} cy={orionSY} r={3} fill="#00CFFF" />
        {/* Ring */}
        <circle cx={orionSX} cy={orionSY} r={5.5} fill="none" stroke="#00CFFF" strokeWidth={0.8} opacity={0.5} />
        <text x={orionLabelX} y={orionLabelY} fill="rgba(0,207,255,0.9)" fontSize={8} fontFamily="monospace" letterSpacing="0.08em">
          ORION
        </text>
      </svg>

      {/* Legend */}
      <div className="px-3 py-1.5 border-t border-white/5 flex gap-4">
        <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>
          <svg width={16} height={4}><line x1={0} y1={2} x2={16} y2={2} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" /></svg>
          Planned
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'rgba(0,207,255,0.6)' }}>
          <svg width={16} height={4}><line x1={0} y1={2} x2={16} y2={2} stroke="#00CFFF" strokeWidth={1.5} /></svg>
          Tracked
        </span>
      </div>
    </div>
  )
}
