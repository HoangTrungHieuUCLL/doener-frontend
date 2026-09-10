// Data-driven motion guide system.
//
// Every exercise is described as two poses (poseA -> poseB -> poseA) of a
// shared stick-figure rig, plus a handful of purely-decorative,
// non-animated extras (machine housing, bench, handheld weight). The
// <ExerciseMotionGuide> component (src/components/ExerciseMotionGuide.tsx)
// is the single renderer for all 22 exercises -- this file only holds pose
// *data*, never markup.
//
// Unit system: u = 20 (head radius = 10 = u/2). Bone lengths (must match
// within ~1px between poseA and poseB -- enforced by boneLengths.test.ts):
//   torso (hip->shoulder)   2.6u  = 52
//   upper arm (shoulder->elbow) 1.55u = 31
//   forearm (elbow->hand)   1.35u = 27
//   thigh (hip->knee)       2u    = 40
//   shank (knee->ankle)     2u    = 40
// viewBox is fixed at 0 0 240 160 for every exercise.

export interface Point {
  x: number
  y: number
}

/** All joint names the rig understands. "2" suffix = secondary/far limb,
 * used for bilateral moves (jumping jacks) or a visible second point. */
export type JointKey =
  | 'head'
  | 'shoulder'
  | 'elbow'
  | 'hand'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'shoulder2'
  | 'elbow2'
  | 'hand2'
  | 'hip2'
  | 'knee2'
  | 'ankle2'

export type Pose = Partial<Record<JointKey, Point>>

export type Equipment = 'bodyweight' | 'machine' | 'cable' | 'free_weight'

/** Decorative, non-animated machine/bench primitives -- these are the only
 * hand-authored-per-exercise visuals; all figure motion is generic. */
export type FrameFill = 'frame' | 'frameDark' | 'seat' | 'accentPlate' | 'plate' | 'shoe' | 'bar'

export type FrameShape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill: FrameFill }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: FrameFill }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: FrameFill; width: number }

export interface MachineConfig {
  /** Fixed pulley/pivot point the cables route through. */
  pulley: Point
  /** Top-left-ish rest position (at poseA) of the top weight plate. */
  stackTopRest: Point
  /** How far (px) the stack travels upward at peak contraction (poseB). */
  stackTravel: number
  /** Which joint the "hand cable" tracks. Defaults to 'hand'. */
  handJoint?: JointKey
  plates?: number
}

/** A small weight shape that rigidly follows a joint through both poses. */
export interface HandheldConfig {
  joint: JointKey
  kind: 'dumbbell'
}

/** Static far-limb silhouette drawn behind the animated figure for depth. */
export interface FarLimbConfig {
  kind: 'leg' | 'arm'
  /** 2 or 3 points: hip/shoulder -> knee/elbow -> ankle/hand. */
  points: Point[]
}

export interface FloorConfig {
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface ExerciseMotionData {
  key: string
  name: string
  equipment: Equipment
  restSec: number
  perSide?: boolean
  timeBased?: boolean
  poseA: Pose
  poseB: Pose
  frameShapes?: FrameShape[]
  machine?: MachineConfig
  handheld?: HandheldConfig
  farLimb?: FarLimbConfig
  floor?: FloorConfig
  durationSec?: number
}
