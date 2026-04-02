'use client'
import { useState, useEffect } from 'react'
import { useTelemetryStore } from '@/store/telemetryStore'
import { MISSION_PHASES, LAUNCH_TIME, getMETString } from '@/lib/mission'

export function MilestoneTimeline() {
  const telemetry = useTelemetryStore((s) => s.telemetry)
  const currentPhase = telemetry?.currentPhase

  const [met, setMET] = useState(() =>
    Math.max(0, (Date.now() - LAUNCH_TIME.getTime()) / 1000)
  )
  useEffect(() => {
    const id = setInterval(() => {
      setMET(Math.max(0, (Date.now() - LAUNCH_TIME.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed top-12 right-4 z-30 w-52 rounded-xl p-4"
      style={{ background: 'rgba(0,10,30,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-white/20 font-mono text-xs tracking-widest uppercase pb-2 mb-2 border-b border-white/5">
        Mission Timeline
      </div>
      <div className="space-y-3">
        {MISSION_PHASES.map((p, i) => {
          const isCurrent = p.phase === currentPhase
          const isComplete = met > p.endMET
          const isUpcoming = met < p.startMET

          let dotColor = 'bg-white/15'
          let labelColor = 'text-white/25'
          if (isComplete) { dotColor = 'bg-white/40'; labelColor = 'text-white/50' }
          if (isCurrent) { dotColor = 'bg-cyan-400'; labelColor = 'text-cyan-300' }

          const timeToNext = isCurrent ? p.endMET - met : null

          return (
            <div key={p.phase} className="flex items-start gap-2">
              <div className="flex flex-col items-center mt-0.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor} ${isCurrent ? 'ring-2 ring-cyan-400/30 ring-offset-1 ring-offset-transparent' : ''}`} />
                {i < MISSION_PHASES.length - 1 && (
                  <div className={`w-px h-6 mt-1 ${isComplete ? 'bg-white/20' : 'bg-white/06'}`} />
                )}
              </div>
              <div className="pb-1">
                <div className={`font-mono text-xs font-medium ${labelColor}`}>{p.label}</div>
                {isCurrent && timeToNext !== null && timeToNext > 0 && (
                  <div className="text-cyan-400/60 font-mono text-xs mt-0.5">
                    Next in {getMETString(timeToNext)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
