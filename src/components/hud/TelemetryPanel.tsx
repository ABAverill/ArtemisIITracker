'use client'
import { useState, useEffect } from 'react'
import { useTelemetryStore } from '@/store/telemetryStore'
import { getMETString, LAUNCH_TIME } from '@/lib/mission'

function useLiveMET(): number {
  const [met, setMET] = useState(() =>
    Math.max(0, (Date.now() - LAUNCH_TIME.getTime()) / 1000)
  )
  useEffect(() => {
    const id = setInterval(() => {
      setMET(Math.max(0, (Date.now() - LAUNCH_TIME.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return met
}

function formatNum(n: number | null | undefined, decimals = 0): string {
  if (n == null || !isFinite(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

interface RowProps { label: string; value: string; unit: string }
function Row({ label, value, unit }: RowProps) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-white/40 font-mono text-xs tracking-wider uppercase whitespace-nowrap">{label}</span>
      <span className="font-mono text-right">
        <span className="text-cyan-300 text-sm font-medium">{value}</span>
        <span className="text-white/30 text-xs ml-1">{unit}</span>
      </span>
    </div>
  )
}

export function TelemetryPanel() {
  const telemetry = useTelemetryStore((s) => s.telemetry)
  const met = useLiveMET()

  if (!telemetry) {
    return (
      <div className="fixed bottom-4 left-4 z-30 w-64 rounded-xl p-4 font-mono text-xs text-white/20"
        style={{ background: 'rgba(0,10,30,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        Acquiring telemetry...
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 w-64 rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(0,10,30,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-white/20 font-mono text-xs tracking-widest uppercase pb-1 border-b border-white/5">
        Orion Telemetry
      </div>
      <Row label="Distance from Earth" value={formatNum(telemetry.distanceFromEarthKm)} unit="km" />
      <Row label="Distance from Moon" value={formatNum(telemetry.distanceFromMoonKm)} unit="km" />
      <Row label="Current Speed" value={formatNum(telemetry.speedKmPerSec, 2)} unit="km/s" />
      <Row label="Mission Elapsed" value={getMETString(met)} unit="" />
      <div className="text-white/15 font-mono text-xs pt-1 border-t border-white/5">
        Position may lag 5–15 min
      </div>
    </div>
  )
}
