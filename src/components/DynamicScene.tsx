'use client'
import dynamic from 'next/dynamic'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

const SceneWithData = dynamic(
  () => import('@/components/SceneWithData').then((m) => m.SceneWithData),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
)

export function DynamicScene() {
  return <SceneWithData />
}
