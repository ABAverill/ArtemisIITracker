'use client'
import { useTelemetryStore } from '@/store/telemetryStore'
import { MISSION_PHASES } from '@/lib/mission'

export function MissionStatus() {
  const telemetry = useTelemetryStore((s) => s.telemetry)

  const phaseInfo = MISSION_PHASES.find((p) => p.phase === telemetry?.currentPhase)
  const phaseLabel = phaseInfo?.label ?? (telemetry?.currentPhase === 'complete' ? 'Mission Complete' : 'Acquiring...')
  const isStale = telemetry?.stale ?? false

  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2"
      style={{ background: 'rgba(2,5,16,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3">
        <span className="text-white font-mono font-bold text-sm tracking-widest uppercase">Artemis II</span>
        <span className="text-white/20 text-xs">|</span>
        <span className="text-cyan-400 font-mono text-xs tracking-wider uppercase">{phaseLabel}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/40 font-mono text-xs hidden sm:block">
          Wiseman · Glover · Koch · Hansen
        </span>
        <div className="flex items-center gap-1.5">
          {isStale ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-mono text-xs tracking-wider">STALE DATA</span>
            </>
          ) : telemetry ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-mono text-xs tracking-wider">LIVE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
              <span className="text-white/40 font-mono text-xs tracking-wider">CONNECTING</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
