'use client'
import useSWR from 'swr'
import { useTelemetryStore } from '@/store/telemetryStore'
import type { OrionTelemetry } from '@/types/telemetry'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const POLL_MS = parseInt(process.env.NEXT_PUBLIC_TELEMETRY_POLL_MS ?? '60000', 10)

export function useTelemetry() {
  const setTelemetry = useTelemetryStore((s) => s.setTelemetry)
  const { data, error, isLoading } = useSWR<OrionTelemetry>('/api/telemetry', fetcher, {
    refreshInterval: POLL_MS,
    revalidateOnFocus: true,
    dedupingInterval: 55_000,
    onSuccess: (data) => {
      if (!('error' in data)) setTelemetry(data)
    },
  })
  return { data, error, isLoading }
}
