import { DynamicScene } from '@/components/DynamicScene'
import { MissionStatus } from '@/components/hud/MissionStatus'
import { TelemetryPanel } from '@/components/hud/TelemetryPanel'
import { MilestoneTimeline } from '@/components/hud/MilestoneTimeline'
import { MiniMap } from '@/components/hud/MiniMap'
import { CameraControlPanel } from '@/components/hud/CameraControlPanel'

export default function Home() {
  return (
    <main className="relative w-full h-full overflow-hidden" style={{ background: '#020510' }}>
      {/* 3D Scene fills full viewport — loaded client-only via DynamicScene */}
      <div className="absolute inset-0">
        <DynamicScene />
      </div>

      {/* HUD overlays */}
      <MissionStatus />
      <TelemetryPanel />
      <MilestoneTimeline />
      <MiniMap />
      <CameraControlPanel />
    </main>
  )
}
