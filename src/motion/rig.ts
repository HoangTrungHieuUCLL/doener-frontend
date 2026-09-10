import type { Point, Pose } from './types'

// Unit system shared by every exercise: u = 20 (head radius = u/2 = 10).
export const U = 20
export const HEAD_R = 10
export const TORSO = 2.6 * U // 52
export const UPPER_ARM = 1.55 * U // 31
export const FOREARM = 1.35 * U // 27
export const THIGH = 2 * U // 40
export const SHANK = 2 * U // 40
export const NECK = 16

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/** Point at `length` along `angleDeg` from `base`. SVG's y grows downward,
 * so 0deg = +x (right), 90deg = +y (down), -90deg/270deg = up, 180deg = left
 * -- ordinary cos/sin, no flip needed. Using a fixed length for a given bone
 * in both poseA and poseB (only the angle differs) guarantees the bone-length
 * invariant the validation test checks. */
export function polar(base: Point, angleDeg: number, length: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  return { x: round(base.x + length * Math.cos(rad)), y: round(base.y + length * Math.sin(rad)) }
}

export interface LimbAngles {
  hip: Point
  /** hip -> shoulder */
  torsoAngle: number
  /** shoulder -> elbow */
  upperArmAngle: number
  /** elbow -> hand */
  forearmAngle: number
  /** hip -> knee */
  thighAngle: number
  /** knee -> ankle */
  shankAngle: number
  /** shoulder -> head, defaults to torsoAngle (head continues the spine) */
  neckAngle?: number
  torsoLen?: number
  upperArmLen?: number
  forearmLen?: number
  thighLen?: number
  shankLen?: number
  neckLen?: number
}

/** Builds one full pose (all 7 primary joints) from hip + a set of joint
 * angles. This is how every exercise except Machine Row (ported verbatim
 * from the reference file) is authored -- guaranteeing matching bone
 * lengths between poseA/poseB by construction instead of by hand-tuning
 * raw coordinates. */
export function buildPose(a: LimbAngles): Pose {
  const shoulder = polar(a.hip, a.torsoAngle, a.torsoLen ?? TORSO)
  const elbow = polar(shoulder, a.upperArmAngle, a.upperArmLen ?? UPPER_ARM)
  const hand = polar(elbow, a.forearmAngle, a.forearmLen ?? FOREARM)
  const knee = polar(a.hip, a.thighAngle, a.thighLen ?? THIGH)
  const ankle = polar(knee, a.shankAngle, a.shankLen ?? SHANK)
  const head = polar(shoulder, a.neckAngle ?? a.torsoAngle, a.neckLen ?? NECK)
  return { hip: a.hip, shoulder, elbow, hand, knee, ankle, head }
}

/** Same as buildPose but writes into the "2" (secondary/far limb) joint
 * slots, for bilateral moves like jumping jacks. */
export function buildPoseSecondary(a: LimbAngles): Pose {
  const shoulder2 = polar(a.hip, a.torsoAngle, a.torsoLen ?? TORSO)
  const elbow2 = polar(shoulder2, a.upperArmAngle, a.upperArmLen ?? UPPER_ARM)
  const hand2 = polar(elbow2, a.forearmAngle, a.forearmLen ?? FOREARM)
  const knee2 = polar(a.hip, a.thighAngle, a.thighLen ?? THIGH)
  const ankle2 = polar(knee2, a.shankAngle, a.shankLen ?? SHANK)
  return { hip2: a.hip, shoulder2, elbow2, hand2, knee2, ankle2 }
}

export function mergePoses(...poses: Pose[]): Pose {
  return Object.assign({}, ...poses) as Pose
}
