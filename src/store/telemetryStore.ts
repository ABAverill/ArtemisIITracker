import { create } from 'zustand'
import type { OrionTelemetry, StateVector } from '@/types/telemetry'

interface TelemetryStore {
  telemetry: OrionTelemetry | null
  trajectory: StateVector[]
  isLoading: boolean
  lastUpdated: Date | null
  setTelemetry: (t: OrionTelemetry) => void
  appendTrajectoryPoints: (pts: StateVector[]) => void
  setLoading: (v: boolean) => void
}

export const useTelemetryStore = create<TelemetryStore>((set) => ({
  telemetry: null,
  trajectory: [],
  isLoading: true,
  lastUpdated: null,
  setTelemetry: (t) => set({ telemetry: t, lastUpdated: new Date(), isLoading: false }),
  appendTrajectoryPoints: (pts) =>
    set((state) => ({
      trajectory: mergeTrajectory(state.trajectory, pts),
    })),
  setLoading: (v) => set({ isLoading: v }),
}))

function mergeTrajectory(existing: StateVector[], incoming: StateVector[]): StateVector[] {
  if (existing.length === 0) return incoming
  const lastTime = existing[existing.length - 1].time
  const newPts = incoming.filter((p) => p.time > lastTime)
  return [...existing, ...newPts]
}
