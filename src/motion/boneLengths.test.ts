import { describe, expect, it } from 'vitest'
import { motionGuides } from './motionGuides'
import type { JointKey, Pose } from './types'

const BONE_PAIRS: [JointKey, JointKey, string][] = [
  ['hip', 'shoulder', 'torso'],
  ['shoulder', 'elbow', 'upper arm'],
  ['elbow', 'hand', 'forearm'],
  ['hip', 'knee', 'thigh'],
  ['knee', 'ankle', 'shank'],
  ['hip2', 'shoulder2', 'torso (secondary)'],
  ['shoulder2', 'elbow2', 'upper arm (secondary)'],
  ['elbow2', 'hand2', 'forearm (secondary)'],
  ['hip2', 'knee2', 'thigh (secondary)'],
  ['knee2', 'ankle2', 'shank (secondary)'],
]

const TOLERANCE_PX = 1

function dist(pose: Pose, a: JointKey, b: JointKey): number | null {
  const p1 = pose[a]
  const p2 = pose[b]
  if (!p1 || !p2) return null
  return Math.hypot(p1.x - p2.x, p1.y - p2.y)
}

describe('motion guide bone lengths (poseA vs poseB)', () => {
  const keys = Object.keys(motionGuides)

  it('covers all 22 exercise keys', () => {
    expect(keys).toHaveLength(22)
  })

  for (const key of keys) {
    const guide = motionGuides[key]

    it(`${key}: every animated bone has equal length in poseA and poseB (±${TOLERANCE_PX}px)`, () => {
      let checked = 0
      for (const [from, to, label] of BONE_PAIRS) {
        const lenA = dist(guide.poseA, from, to)
        const lenB = dist(guide.poseB, from, to)
        if (lenA === null || lenB === null) continue
        checked += 1
        const diff = Math.abs(lenA - lenB)
        expect(
          diff,
          `${key} ${label} (${from}->${to}): poseA=${lenA.toFixed(2)}px poseB=${lenB.toFixed(2)}px diff=${diff.toFixed(2)}px`,
        ).toBeLessThanOrEqual(TOLERANCE_PX)
      }
      // Sanity: every exercise should have at least the core 5 bones.
      expect(checked).toBeGreaterThanOrEqual(5)
    })
  }
})
