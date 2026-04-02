'use client'
import { SpaceScene } from './scene/SpaceScene'
import { useTelemetry } from '@/hooks/useTelemetry'
import { useTrajectory } from '@/hooks/useTrajectory'

export function SceneWithData() {
  useTelemetry()
  useTrajectory()
  return <SpaceScene />
}
