import { useId, useMemo } from 'react'
import type { JSX } from 'react'
import type {
  Equipment,
  FarLimbConfig,
  FrameFill,
  FrameShape,
  HandheldConfig,
  JointKey,
  MachineConfig,
  Point,
  Pose,
} from '../motion/types'

// Shared SMIL timing/easing -- matches the Machine Row reference file
// exactly, applied to every animated attribute in every exercise so the
// whole set reads as one consistent system.
const DEFAULT_DUR = 2.2
const KEY_TIMES = '0;0.5;1'
const CALC_MODE = 'spline'
const KEY_SPLINES = '0.42 0 0.58 1;0.42 0 0.58 1'

const EPS = 0.05

interface BoneDef {
  from: JointKey
  to: JointKey
  width: number
}

// hip->shoulder = torso, hip->knee = thigh, knee->ankle = shank,
// shoulder->elbow = upper arm, elbow->hand = forearm. Stroke widths lifted
// straight from the reference file. Declared once for the primary rig and
// once more for the "2" (secondary/bilateral) rig.
const BONE_DEFS: BoneDef[] = [
  { from: 'hip', to: 'knee', width: 8 },
  { from: 'knee', to: 'ankle', width: 7 },
  { from: 'hip', to: 'shoulder', width: 9 },
  { from: 'shoulder', to: 'elbow', width: 7 },
  { from: 'elbow', to: 'hand', width: 6 },
  { from: 'hip2', to: 'knee2', width: 8 },
  { from: 'knee2', to: 'ankle2', width: 7 },
  { from: 'hip2', to: 'shoulder2', width: 9 },
  { from: 'shoulder2', to: 'elbow2', width: 7 },
  { from: 'elbow2', to: 'hand2', width: 6 },
]

const JOINT_RADIUS: Partial<Record<JointKey, number>> = {
  hip: 4.5,
  hip2: 4.5,
  knee: 4,
  knee2: 4,
  shoulder: 3.8,
  shoulder2: 3.8,
  elbow: 3.4,
  elbow2: 3.4,
}

function darken(hex: string, amount: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return hex
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => Math.round(parseInt(h, 16) * (1 - amount)))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function approxEqual(a: number, b: number) {
  return Math.abs(a - b) < EPS
}

/** A <animate> for one numeric attribute; omitted entirely when the value
 * doesn't change between poses (renders as a static attribute instead). */
function AnimatedNum({
  attributeName,
  a,
  b,
  dur,
}: {
  attributeName: string
  a: number
  b: number
  dur: number
}) {
  if (approxEqual(a, b)) return null
  return (
    <animate
      attributeName={attributeName}
      values={`${a};${b};${a}`}
      keyTimes={KEY_TIMES}
      calcMode={CALC_MODE}
      keySplines={KEY_SPLINES}
      dur={`${dur}s`}
      repeatCount="indefinite"
    />
  )
}

function fillFor(fill: FrameFill, ids: { frame: string; accent: string }): { fill?: string; stroke?: string } {
  switch (fill) {
    case 'frame':
      return { fill: `url(#${ids.frame})` }
    case 'frameDark':
      return { fill: '#4a4c53' }
    case 'seat':
      return { fill: '#3a3b41', stroke: '#46474d' }
    case 'accentPlate':
      return { fill: ids.accent }
    case 'plate':
      return { fill: '#2c2d31', stroke: '#3d3e44' }
    case 'shoe':
      return { fill: '#2c2d31' }
    case 'bar':
      return { fill: '#8a8d95' }
    default:
      return {}
  }
}

function renderFrameShape(shape: FrameShape, i: number, ids: { frame: string; accent: string }) {
  if (shape.kind === 'rect') {
    const colors = fillFor(shape.fill, ids)
    return (
      <rect
        key={i}
        x={shape.x}
        y={shape.y}
        width={shape.w}
        height={shape.h}
        rx={shape.rx ?? 0}
        {...colors}
      />
    )
  }
  if (shape.kind === 'circle') {
    const colors = fillFor(shape.fill, ids)
    return <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...colors} />
  }
  const colors = fillFor(shape.stroke, ids)
  return (
    <line
      key={i}
      x1={shape.x1}
      y1={shape.y1}
      x2={shape.x2}
      y2={shape.y2}
      stroke={colors.fill ?? colors.stroke}
      strokeWidth={shape.width}
      strokeLinecap="round"
    />
  )
}

function renderFarLimb(far: FarLimbConfig, color: string) {
  const [p0, p1, p2] = far.points
  const width = far.kind === 'leg' ? 8 : 7
  return (
    <g opacity={0.9}>
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
      {p2 && (
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={width - 1} strokeLinecap="round" />
      )}
    </g>
  )
}

function Stack({
  machine,
  accent,
  dur,
}: {
  machine: MachineConfig
  accent: string
  dur: number
}) {
  const plates = machine.plates ?? 5
  const { x, y } = machine.stackTopRest
  const plateH = 8
  const plateW = 18
  return (
    <g>
      <rect x={x} y={y} width={plateW} height={plateH} rx={1.5} fill={accent} />
      {Array.from({ length: plates - 1 }).map((_, i) => (
        <rect
          key={i}
          x={x}
          y={y + (i + 1) * plateH}
          width={plateW}
          height={plateH}
          rx={1.5}
          fill="#2c2d31"
          stroke="#3d3e44"
        />
      ))}
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`0 0;0 ${-machine.stackTravel};0 0`}
        keyTimes={KEY_TIMES}
        calcMode={CALC_MODE}
        keySplines={KEY_SPLINES}
        dur={`${dur}s`}
        repeatCount="indefinite"
      />
    </g>
  )
}

export interface ExerciseMotionGuideProps {
  poseA: Pose
  poseB: Pose
  equipment: Equipment
  accent: string
  frameShapes?: FrameShape[]
  machine?: MachineConfig
  handheld?: HandheldConfig
  farLimb?: FarLimbConfig
  floor?: { cx: number; cy: number; rx: number; ry: number }
  durationSec?: number
  label?: string
  className?: string
}

const JOINT_KEYS: JointKey[] = [
  'head',
  'shoulder',
  'elbow',
  'hand',
  'hip',
  'knee',
  'ankle',
  'shoulder2',
  'elbow2',
  'hand2',
  'hip2',
  'knee2',
  'ankle2',
]

export function ExerciseMotionGuide({
  poseA,
  poseB,
  equipment,
  accent,
  frameShapes,
  machine,
  handheld,
  farLimb,
  floor,
  durationSec = DEFAULT_DUR,
  label,
  className,
}: ExerciseMotionGuideProps) {
  const reactId = useId().replace(/[:]/g, '')
  const ids = useMemo(
    () => ({
      body: `bodyGrad-${reactId}`,
      frame: `frameGrad-${reactId}`,
      floorGlow: `floorGlow-${reactId}`,
      soft: `soft-${reactId}`,
    }),
    [reactId],
  )

  const accentDark = darken(accent, 0.35)
  const dur = durationSec
  const floorCfg = floor ?? { cx: 120, cy: 146, rx: 92, ry: 9 }
  const activeJoints = JOINT_KEYS.filter((k) => poseA[k] && poseB[k])

  const bones = BONE_DEFS.filter((b) => poseA[b.from] && poseA[b.to])

  const handJointKey: JointKey = machine?.handJoint ?? 'hand'
  const handA = poseA[handJointKey]
  const handB = poseB[handJointKey]

  return (
    <svg
      viewBox="0 0 240 160"
      className={className}
      role="img"
      aria-label={label ?? 'Exercise motion guide'}
    >
      <defs>
        <linearGradient id={ids.body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </linearGradient>
        <linearGradient id={ids.frame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b6e77" />
          <stop offset="100%" stopColor="#4a4c53" />
        </linearGradient>
        <radialGradient id={ids.floorGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <filter id={ids.soft} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity={0.45} />
        </filter>
      </defs>

      {/* floor shadow for depth */}
      <ellipse cx={floorCfg.cx} cy={floorCfg.cy} rx={floorCfg.rx} ry={floorCfg.ry} fill={`url(#${ids.floorGlow})`} />

      {/* static decorative machine/bench housing */}
      {frameShapes?.map((s, i) => renderFrameShape(s, i, { frame: ids.frame, accent }))}

      {machine && (
        <g>
          <circle cx={machine.pulley.x} cy={machine.pulley.y} r={8} fill="#8a8d95" />
          <circle cx={machine.pulley.x - 2.5} cy={machine.pulley.y - 2.5} r={2.3} fill="#c7c9d1" />
          <Stack machine={machine} accent={accent} dur={dur} />
          {/* stack cable: pulley -> top of stack */}
          <line
            x1={machine.pulley.x}
            y1={machine.pulley.y + 8}
            x2={machine.stackTopRest.x + 9}
            y2={machine.stackTopRest.y}
            stroke="#c9cacf"
            strokeWidth={1.6}
          >
            <AnimatedNum
              attributeName="y2"
              a={machine.stackTopRest.y}
              b={machine.stackTopRest.y - machine.stackTravel}
              dur={dur}
            />
          </line>
          {/* hand cable: pulley -> hand */}
          {handA && handB && (
            <line
              x1={machine.pulley.x}
              y1={machine.pulley.y - 4}
              x2={handA.x}
              y2={handA.y}
              stroke="#c9cacf"
              strokeWidth={1.6}
            >
              <AnimatedNum attributeName="x2" a={handA.x} b={handB.x} dur={dur} />
              <AnimatedNum attributeName="y2" a={handA.y} b={handB.y} dur={dur} />
            </line>
          )}
        </g>
      )}

      {farLimb && renderFarLimb(farLimb, darken(accent, 0.55))}

      {/* animated figure */}
      <g filter={`url(#${ids.soft})`}>
        {bones.map((bone, i) => {
          const a1 = poseA[bone.from] as Point
          const a2 = poseA[bone.to] as Point
          const b1 = poseB[bone.from] as Point
          const b2 = poseB[bone.to] as Point
          return (
            <line
              key={i}
              x1={a1.x}
              y1={a1.y}
              x2={a2.x}
              y2={a2.y}
              stroke={`url(#${ids.body})`}
              strokeWidth={bone.width}
              strokeLinecap="round"
            >
              <AnimatedNum attributeName="x1" a={a1.x} b={b1.x} dur={dur} />
              <AnimatedNum attributeName="y1" a={a1.y} b={b1.y} dur={dur} />
              <AnimatedNum attributeName="x2" a={a2.x} b={b2.x} dur={dur} />
              <AnimatedNum attributeName="y2" a={a2.y} b={b2.y} dur={dur} />
            </line>
          )
        })}

        {/* joints */}
        {activeJoints
          .filter((k) => JOINT_RADIUS[k])
          .map((k) => {
            const a = poseA[k] as Point
            const b = poseB[k] as Point
            return (
              <circle key={k} cx={a.x} cy={a.y} r={JOINT_RADIUS[k]} fill={accentDark}>
                <AnimatedNum attributeName="cx" a={a.x} b={b.x} dur={dur} />
                <AnimatedNum attributeName="cy" a={a.y} b={b.y} dur={dur} />
              </circle>
            )
          })}

        {/* ankle shoe(s) */}
        {(['ankle', 'ankle2'] as JointKey[])
          .filter((k) => poseA[k] && poseB[k])
          .map((k) => {
            const a = poseA[k] as Point
            const b = poseB[k] as Point
            return (
              <rect key={k} x={a.x - 8} y={a.y - 3} width={16} height={7} rx={3.5} fill="#2c2d31">
                <AnimatedNum attributeName="x" a={a.x - 8} b={b.x - 8} dur={dur} />
                <AnimatedNum attributeName="y" a={a.y - 3} b={b.y - 3} dur={dur} />
              </rect>
            )
          })}

        {/* hand grip: a small handle block for machine/cable/free_weight,
            otherwise a plain joint dot already covers bodyweight hands */}
        {(['hand', 'hand2'] as JointKey[])
          .filter((k) => poseA[k] && poseB[k])
          .map((k) => {
            const a = poseA[k] as Point
            const b = poseB[k] as Point
            if (equipment === 'bodyweight') {
              return (
                <circle key={k} cx={a.x} cy={a.y} r={3.4} fill={accentDark}>
                  <AnimatedNum attributeName="cx" a={a.x} b={b.x} dur={dur} />
                  <AnimatedNum attributeName="cy" a={a.y} b={b.y} dur={dur} />
                </circle>
              )
            }
            return (
              <rect
                key={k}
                x={a.x - 5.5}
                y={a.y - 3.5}
                width={11}
                height={7}
                rx={2}
                fill="#3a3b41"
                stroke="#52545c"
              >
                <AnimatedNum attributeName="x" a={a.x - 5.5} b={b.x - 5.5} dur={dur} />
                <AnimatedNum attributeName="y" a={a.y - 3.5} b={b.y - 3.5} dur={dur} />
              </rect>
            )
          })}

        {handheld && <Handheld cfg={handheld} poseA={poseA} poseB={poseB} dur={dur} />}

        {/* head */}
        {poseA.head && poseB.head && (
          <>
            <circle cx={poseA.head.x} cy={poseA.head.y} r={10} fill={`url(#${ids.body})`}>
              <AnimatedNum attributeName="cx" a={poseA.head.x} b={poseB.head.x} dur={dur} />
              <AnimatedNum attributeName="cy" a={poseA.head.y} b={poseB.head.y} dur={dur} />
            </circle>
            <circle cx={poseA.head.x - 3} cy={poseA.head.y - 3} r={2.6} fill="#fff" opacity={0.55}>
              <AnimatedNum attributeName="cx" a={poseA.head.x - 3} b={poseB.head.x - 3} dur={dur} />
              <AnimatedNum attributeName="cy" a={poseA.head.y - 3} b={poseB.head.y - 3} dur={dur} />
            </circle>
          </>
        )}
      </g>
    </svg>
  )
}

function Handheld({
  cfg,
  poseA,
  poseB,
  dur,
}: {
  cfg: HandheldConfig
  poseA: Pose
  poseB: Pose
  dur: number
}): JSX.Element | null {
  const a = poseA[cfg.joint]
  const b = poseB[cfg.joint]
  if (!a || !b) return null
  const w = 15
  const h = 6.5
  return (
    <g>
      <rect x={a.x - w / 2} y={a.y - h / 2} width={w} height={h} rx={2} fill="#3a3b41" stroke="#52545c">
        <AnimatedNum attributeName="x" a={a.x - w / 2} b={b.x - w / 2} dur={dur} />
        <AnimatedNum attributeName="y" a={a.y - h / 2} b={b.y - h / 2} dur={dur} />
      </rect>
      <circle cx={a.x - w / 2} cy={a.y} r={4} fill="#2c2d31">
        <AnimatedNum attributeName="cx" a={a.x - w / 2} b={b.x - w / 2} dur={dur} />
        <AnimatedNum attributeName="cy" a={a.y} b={b.y} dur={dur} />
      </circle>
      <circle cx={a.x + w / 2} cy={a.y} r={4} fill="#2c2d31">
        <AnimatedNum attributeName="cx" a={a.x + w / 2} b={b.x + w / 2} dur={dur} />
        <AnimatedNum attributeName="cy" a={a.y} b={b.y} dur={dur} />
      </circle>
    </g>
  )
}
