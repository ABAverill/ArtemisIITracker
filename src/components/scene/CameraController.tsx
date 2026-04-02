'use client'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCameraStore } from '@/store/cameraStore'
import { useTelemetryStore } from '@/store/telemetryStore'
import { icrfToScene } from '@/lib/coordinates'

const ROT_STEP  = 0.28   // radians per click (~16°)
const ZOOM_IN   = 0.78   // scale factor for zoom in
const ZOOM_OUT  = 1.28   // scale factor for zoom out (reciprocal of zoom in)
const MIN_DIST  = 1
const MAX_DIST  = 300

export function CameraController() {
  const { camera, controls } = useThree()
  const registerActions      = useCameraStore((s) => s.registerActions)
  const registered           = useRef(false)

  useEffect(() => {
    if (!controls || registered.current) return
    registered.current = true

    const ctrl = controls as any

    // ── Helpers (read live camera/controls state at call time) ───────────────

    function getOffset(): THREE.Vector3 {
      return camera.position.clone().sub(ctrl.target as THREE.Vector3)
    }

    /** Rotate camera around `axis` by `angle` radians, keeping same distance */
    function rotateAround(axis: THREE.Vector3, angle: number) {
      const offset = getOffset()
      offset.applyAxisAngle(axis, angle)
      camera.position.copy((ctrl.target as THREE.Vector3)).add(offset)
      camera.lookAt(ctrl.target as THREE.Vector3)
      ctrl.update()
    }

    /** Camera's current horizontal-right vector (perpendicular to view, XZ plane) */
    function getCamRight(): THREE.Vector3 {
      const offset = getOffset()
      return new THREE.Vector3(-offset.z, 0, offset.x).normalize()
    }

    /** Scale camera distance from target, clamped to [MIN_DIST, MAX_DIST] */
    function zoom(factor: number) {
      const offset = getOffset()
      const newLen = THREE.MathUtils.clamp(offset.length() * factor, MIN_DIST, MAX_DIST)
      offset.setLength(newLen)
      camera.position.copy((ctrl.target as THREE.Vector3)).add(offset)
      ctrl.update()
    }

    registerActions({
      rotateLeft:  () => rotateAround(new THREE.Vector3(0, 1, 0),  ROT_STEP),
      rotateRight: () => rotateAround(new THREE.Vector3(0, 1, 0), -ROT_STEP),
      rotateUp:    () => rotateAround(getCamRight(), -ROT_STEP),
      rotateDown:  () => rotateAround(getCamRight(),  ROT_STEP),
      zoomIn:      () => zoom(ZOOM_IN),
      zoomOut:     () => zoom(ZOOM_OUT),

      recenter: () => {
        // Target = midpoint between Earth (origin) and Moon (live or default)
        const tel = useTelemetryStore.getState().telemetry
        let mid = new THREE.Vector3(19.2, 0, 0)
        if (tel) {
          mid = icrfToScene(tel.moonPosition).multiplyScalar(0.5)
        }
        const moonDist = mid.length() * 2 // full Earth-Moon distance in scene units
        const pullback  = Math.max(50, moonDist * 2.4)
        camera.position.set(mid.x, mid.y + pullback * 0.35, mid.z + pullback * 0.85)
        ctrl.target.copy(mid)
        ctrl.update()
      },
    })
  }, [controls, camera, registerActions])

  return null
}
