'use client'
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: '#020510' }}>
      <div className="relative mb-8">
        <div className="w-16 h-16 border-2 border-cyan-400/30 rounded-full animate-spin border-t-cyan-400" />
      </div>
      <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase animate-pulse">
        Acquiring Telemetry
      </p>
      <p className="text-white/30 font-mono text-xs mt-2 tracking-wider">
        Artemis II · Orion Spacecraft
      </p>
    </div>
  )
}
