import { create } from 'zustand'

export interface CameraActions {
  rotateLeft:  () => void
  rotateRight: () => void
  rotateUp:    () => void
  rotateDown:  () => void
  zoomIn:      () => void
  zoomOut:     () => void
  recenter:    () => void
}

interface CameraStore extends CameraActions {
  ready: boolean
  registerActions: (actions: CameraActions) => void
}

const noop = () => {}

export const useCameraStore = create<CameraStore>((set) => ({
  ready:       false,
  rotateLeft:  noop,
  rotateRight: noop,
  rotateUp:    noop,
  rotateDown:  noop,
  zoomIn:      noop,
  zoomOut:     noop,
  recenter:    noop,
  registerActions: (actions) => set({ ...actions, ready: true }),
}))
