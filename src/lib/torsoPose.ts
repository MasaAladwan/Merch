import * as THREE from 'three'

/** A MediaPipe pose landmark. World landmarks are in metres: x right, y down, z away from the camera. */
export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export const LEFT_SHOULDER = 11
export const RIGHT_SHOULDER = 12
export const LEFT_HIP = 23
export const RIGHT_HIP = 24

const MIN_VISIBILITY = 0.5

// MediaPipe has y down and z away from the camera; three.js has y up and z toward it.
function toThree(p: Landmark, out: THREE.Vector3): THREE.Vector3 {
  return out.set(p.x, -p.y, -p.z)
}

const ls = new THREE.Vector3()
const rs = new THREE.Vector3()
const lh = new THREE.Vector3()
const rh = new THREE.Vector3()
const xAxis = new THREE.Vector3()
const yAxis = new THREE.Vector3()
const zAxis = new THREE.Vector3()
const basis = new THREE.Matrix4()

function seen(p: Landmark | undefined): p is Landmark {
  return !!p && (p.visibility ?? 0) > MIN_VISIBILITY
}

/**
 * Orientation of the torso as a rotation for a garment whose front faces +z and
 * whose wearer's left is +x. Facing the camera gives the identity; back to the
 * camera gives a half turn about the vertical axis.
 *
 * The spine direction comes from the hips when they are in view; otherwise the
 * torso is assumed upright (typical when sitting at a desk with hips out of frame).
 */
export function torsoQuaternion(world: Landmark[], out: THREE.Quaternion): THREE.Quaternion {
  toThree(world[LEFT_SHOULDER], ls)
  toThree(world[RIGHT_SHOULDER], rs)
  xAxis.subVectors(ls, rs).normalize()

  const leftHip = world[LEFT_HIP]
  const rightHip = world[RIGHT_HIP]
  if (seen(leftHip) && seen(rightHip)) {
    toThree(leftHip, lh)
    toThree(rightHip, rh)
    yAxis.addVectors(ls, rs).sub(lh).sub(rh).normalize()
  } else {
    yAxis.set(0, 1, 0)
  }

  zAxis.crossVectors(xAxis, yAxis)
  // Shoulders lined up with the spine: no usable orientation, keep the previous one.
  if (zAxis.lengthSq() < 1e-6) return out
  zAxis.normalize()
  yAxis.crossVectors(zAxis, xAxis)
  return out.setFromRotationMatrix(basis.makeBasis(xAxis, yAxis, zAxis))
}

/**
 * How much of the true shoulder width is visible in the image plane: 1 when
 * facing the camera (or with the back to it), near 0 when side-on.
 */
export function shoulderForeshortening(world: Landmark[]): number {
  const l = world[LEFT_SHOULDER]
  const r = world[RIGHT_SHOULDER]
  const dx = l.x - r.x
  const dy = l.y - r.y
  const dz = l.z - r.z
  const full = Math.hypot(dx, dy, dz)
  return full > 0 ? Math.hypot(dx, dy) / full : 0
}
