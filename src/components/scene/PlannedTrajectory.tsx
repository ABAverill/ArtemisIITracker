'use client'
import { useMemo } from 'react'
import * as THREE from 'three'

interface Props {
  moonPos: THREE.Vector3
}

/**
 * Renders a ghost line showing the approximate planned free-return trajectory
 * of Artemis II from Earth, looping around the Moon, and returning to Earth.
 * This is a visual approximation — not the precise ephemeris.
 */
export function PlannedTrajectory({ moonPos }: Props) {
  const line = useMemo(() => {
    const moonDist = moonPos.length()
    if (moonDist < 1) return null

    const md = moonPos.clone().normalize()
    // Perpendicular in the XZ plane for the trajectory arc
    const perp = new THREE.Vector3(-md.z, 0, md.x).normalize()
    const flyby = 9337 / 10000 // flyby altitude from Moon center in scene units

    // Approximate free-return trajectory waypoints
    const waypoints = [
      new THREE.Vector3(0, 0, 0),                                                    // Earth
      md.clone().multiplyScalar(moonDist * 0.22).addScaledVector(perp, moonDist * 0.07),
      md.clone().multiplyScalar(moonDist * 0.55).addScaledVector(perp, moonDist * 0.055),
      md.clone().multiplyScalar(moonDist * 0.82).addScaledVector(perp, moonDist * 0.025),
      moonPos.clone().addScaledVector(md.clone().negate(), flyby * 1.1),             // Moon approach
      moonPos.clone().addScaledVector(perp, flyby),                                  // Closest approach
      moonPos.clone().addScaledVector(md, flyby * 1.1),                              // Moon departure
      md.clone().multiplyScalar(moonDist * 0.82).addScaledVector(perp, -moonDist * 0.025),
      md.clone().multiplyScalar(moonDist * 0.55).addScaledVector(perp, -moonDist * 0.055),
      md.clone().multiplyScalar(moonDist * 0.22).addScaledVector(perp, -moonDist * 0.07),
      new THREE.Vector3(0, 0, 0),                                                    // Earth return
    ]

    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.5)
    const points = curve.getPoints(300)

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.12,
    })

    return new THREE.Line(geometry, material)
  }, [moonPos])

  if (!line) return null
  return <primitive object={line} />
}
