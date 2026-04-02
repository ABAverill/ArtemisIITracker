import * as THREE from 'three'

const SCALE = 1 / 10000 // 1 scene unit = 10,000 km

export function icrfToScene(km: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(km.x * SCALE, km.z * SCALE, -km.y * SCALE)
}

export const EARTH_RADIUS_SCENE = 6371 / 10000
export const MOON_RADIUS_SCENE = 1737 / 10000
