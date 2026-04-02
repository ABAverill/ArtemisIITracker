'use client'
import { useCameraStore } from '@/store/cameraStore'

interface BtnProps {
  onClick: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}

function Btn({ onClick, title, children, wide }: BtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center rounded-lg font-mono text-sm transition-all duration-100
        text-white/50 hover:text-cyan-300 hover:bg-white/10 active:scale-90 active:text-cyan-400
        ${wide ? 'col-span-2 h-7' : 'h-8 w-8'}`}
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </button>
  )
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────
const ArrowUp    = () => <svg width={12} height={12} viewBox="0 0 12 12"><path d="M6 2L11 10H1z" fill="currentColor"/></svg>
const ArrowDown  = () => <svg width={12} height={12} viewBox="0 0 12 12"><path d="M6 10L1 2H11z" fill="currentColor"/></svg>
const ArrowLeft  = () => <svg width={12} height={12} viewBox="0 0 12 12"><path d="M2 6L10 1V11z" fill="currentColor"/></svg>
const ArrowRight = () => <svg width={12} height={12} viewBox="0 0 12 12"><path d="M10 6L2 11V1z" fill="currentColor"/></svg>
const ZoomIn     = () => <svg width={13} height={13} viewBox="0 0 13 13"><circle cx={5.5} cy={5.5} r={4} fill="none" stroke="currentColor" strokeWidth={1.5}/><line x1={5.5} y1={3} x2={5.5} y2={8} stroke="currentColor" strokeWidth={1.5}/><line x1={3} y1={5.5} x2={8} y2={5.5} stroke="currentColor" strokeWidth={1.5}/><line x1={8.5} y1={8.5} x2={12} y2={12} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
const ZoomOut    = () => <svg width={13} height={13} viewBox="0 0 13 13"><circle cx={5.5} cy={5.5} r={4} fill="none" stroke="currentColor" strokeWidth={1.5}/><line x1={3} y1={5.5} x2={8} y2={5.5} stroke="currentColor" strokeWidth={1.5}/><line x1={8.5} y1={8.5} x2={12} y2={12} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
const Recenter   = () => (
  <svg width={13} height={13} viewBox="0 0 13 13">
    <circle cx={6.5} cy={6.5} r={5} fill="none" stroke="currentColor" strokeWidth={1.4}/>
    <circle cx={6.5} cy={6.5} r={1.5} fill="currentColor"/>
    <line x1={6.5} y1={1} x2={6.5} y2={3.5} stroke="currentColor" strokeWidth={1.4}/>
    <line x1={6.5} y1={9.5} x2={6.5} y2={12} stroke="currentColor" strokeWidth={1.4}/>
    <line x1={1} y1={6.5} x2={3.5} y2={6.5} stroke="currentColor" strokeWidth={1.4}/>
    <line x1={9.5} y1={6.5} x2={12} y2={6.5} stroke="currentColor" strokeWidth={1.4}/>
  </svg>
)

// ── Panel ────────────────────────────────────────────────────────────────────
export function CameraControlPanel() {
  const { rotateLeft, rotateRight, rotateUp, rotateDown, zoomIn, zoomOut, recenter, ready } = useCameraStore()

  return (
    <div
      className="fixed top-14 left-4 z-30 rounded-xl p-2.5 select-none"
      style={{
        background: 'rgba(0,10,30,0.72)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        opacity: ready ? 1 : 0.4,
        transition: 'opacity 0.3s',
      }}
    >
      {/* Label */}
      <div className="text-white/20 font-mono text-xs tracking-widest uppercase text-center mb-2">
        Camera
      </div>

      {/* D-pad: rotate */}
      <div className="grid grid-cols-3 gap-1 place-items-center">
        <div />
        <Btn onClick={rotateUp}    title="Tilt up"><ArrowUp /></Btn>
        <div />

        <Btn onClick={rotateLeft}  title="Rotate left"><ArrowLeft /></Btn>
        <Btn onClick={recenter}    title="Recenter view"><Recenter /></Btn>
        <Btn onClick={rotateRight} title="Rotate right"><ArrowRight /></Btn>

        <div />
        <Btn onClick={rotateDown}  title="Tilt down"><ArrowDown /></Btn>
        <div />
      </div>

      {/* Zoom row */}
      <div className="flex items-center gap-1 mt-1.5">
        <Btn onClick={zoomOut} title="Zoom out"><ZoomOut /></Btn>
        <span className="flex-1 text-center font-mono text-xs text-white/15 tracking-widest">ZOOM</span>
        <Btn onClick={zoomIn}  title="Zoom in"><ZoomIn /></Btn>
      </div>
    </div>
  )
}
