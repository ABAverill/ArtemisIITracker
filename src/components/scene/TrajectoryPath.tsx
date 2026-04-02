'use client'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { icrfToScene } from '@/lib/coordinates'
import type { StateVector } from '@/types/telemetry'

interface Props {
  trajectory: StateVector[]
}

export function TrajectoryPath({ trajectory }: Props) {
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({
      color: '#00CFFF',
      transparent: true,
      opacity: 0.6,
    })
    return new THREE.Line(geometry, material)
  }, [])

  useEffect(() => {
    if (trajectory.length < 2) return

    const positions: number[] = []
    trajectory.forEach((pt) => {
      const v = icrfToScene({ x: pt.x, y: pt.y, z: pt.z })
      positions.push(v.x, v.y, v.z)
    })

    lineObject.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )
    lineObject.geometry.setDrawRange(0, positions.length / 3)
    lineObject.geometry.computeBoundingSphere()
  }, [trajectory, lineObject])

  if (trajectory.length < 2) return null

  return <primitive object={lineObject} />
}
