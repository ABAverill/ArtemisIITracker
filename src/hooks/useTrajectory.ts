'use client'
import useSWR from 'swr'
import { useTelemetryStore } from '@/store/telemetryStore'
import type { StateVector } from '@/types/telemetry'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const POLL_MS = parseInt(process.env.NEXT_PUBLIC_TRAJECTORY_POLL_MS ?? '300000', 10)

export function useTrajectory() {
  const appendTrajectoryPoints = useTelemetryStore((s) => s.appendTrajectoryPoints)
  const { data, error } = useSWR<StateVector[]>('/api/trajectory', fetcher, {
    refreshInterval: POLL_MS,
    revalidateOnFocus: false,
    onSuccess: (data) => {
      if (Array.isArray(data)) appendTrajectoryPoints(data)
    },
  })
  return { data, error }
}
