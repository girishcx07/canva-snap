// Animation engine. Presets are declarative keyframe sets grouped by category.
// A "sampled" frame is an overlay applied on top of a layer's resting transform:
//   x / y / rotation -> additive offsets,  scale / opacity -> absolute values.
// The runtime composes these so presets compose with morphing and layout.

import { uid } from '../doc'
import type {
  AnimationCategory,
  AnimationInstance,
  AnimationPreset,
  Keyframe,
} from '../types'
import { lerp } from './easing'

export type SampledFrame = {
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
}

const REST: SampledFrame = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // Entrance
  preset('fade-in', 'Fade In', 'entrance', 500, [
    { offset: 0, transform: { opacity: 0 } },
    { offset: 1, transform: { opacity: 1 } },
  ]),
  preset('slide-in', 'Slide In', 'entrance', 600, [
    { offset: 0, transform: { x: -80, opacity: 0 } },
    { offset: 1, transform: { x: 0, opacity: 1 } },
  ]),
  preset('scale-in', 'Scale In', 'entrance', 500, [
    { offset: 0, transform: { scale: 0.8, opacity: 0 } },
    { offset: 1, transform: { scale: 1, opacity: 1 } },
  ]),
  preset('pop-in', 'Pop', 'entrance', 600, [
    { offset: 0, transform: { scale: 0, opacity: 0 } },
    { offset: 0.7, transform: { scale: 1.08, opacity: 1 } },
    { offset: 1, transform: { scale: 1, opacity: 1 } },
  ]),
  // Exit
  preset('fade-out', 'Fade Out', 'exit', 400, [
    { offset: 0, transform: { opacity: 1 } },
    { offset: 1, transform: { opacity: 0 } },
  ]),
  preset('collapse', 'Collapse', 'exit', 450, [
    { offset: 0, transform: { scale: 1, opacity: 1 } },
    { offset: 1, transform: { scale: 0, opacity: 0 } },
  ]),
  // Attention
  preset('bounce', 'Bounce', 'attention', 700, [
    { offset: 0, transform: { y: 0 } },
    { offset: 0.5, transform: { y: -24 } },
    { offset: 1, transform: { y: 0 } },
  ]),
  preset('shake', 'Shake', 'attention', 500, [
    { offset: 0, transform: { x: 0 } },
    { offset: 0.25, transform: { x: -10 } },
    { offset: 0.75, transform: { x: 10 } },
    { offset: 1, transform: { x: 0 } },
  ]),
  preset('pulse', 'Pulse', 'attention', 600, [
    { offset: 0, transform: { scale: 1 } },
    { offset: 0.5, transform: { scale: 1.1 } },
    { offset: 1, transform: { scale: 1 } },
  ]),
  // Advanced (these cooperate with the morph engine at slide boundaries)
  preset('morph', 'Morph', 'advanced', 600, [
    { offset: 0, transform: { opacity: 0, scale: 0.96 } },
    { offset: 1, transform: { opacity: 1, scale: 1 } },
  ]),
  preset('shared-element', 'Shared Element', 'advanced', 600, [
    { offset: 0, transform: {} },
    { offset: 1, transform: {} },
  ]),
  preset('smart-move', 'Smart Move', 'advanced', 600, [
    { offset: 0, transform: {} },
    { offset: 1, transform: {} },
  ]),
  preset('path', 'Path', 'advanced', 900, [
    { offset: 0, transform: { x: 0, y: 0 } },
    { offset: 0.5, transform: { x: 120, y: -60 } },
    { offset: 1, transform: { x: 240, y: 0 } },
  ]),
]

const byId = new Map(ANIMATION_PRESETS.map((p) => [p.id, p]))

export function getPreset(id: string): AnimationPreset | undefined {
  return byId.get(id)
}

export function presetsByCategory(
  category: AnimationCategory,
): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((p) => p.category === category)
}

export const ANIMATION_CATEGORIES: AnimationCategory[] = [
  'entrance',
  'exit',
  'attention',
  'advanced',
]

export function createAnimationInstance(presetId: string): AnimationInstance {
  const p = getPreset(presetId)
  return {
    id: uid('anim'),
    presetId,
    trigger: p?.category === 'exit' ? 'slide-exit' : 'slide-enter',
    delayMs: 0,
    durationMs: p?.defaultDurationMs ?? 500,
    easing: p?.defaultEasing ?? 'easeInOut',
    repeat: 0,
  }
}

// Sample a preset at normalized progress p (0..1) -> overlay frame.
export function sampleKeyframes(keyframes: Keyframe[], p: number): SampledFrame {
  if (keyframes.length === 0) return REST
  let lower = keyframes[0]
  let upper = keyframes[keyframes.length - 1]
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].offset && p <= keyframes[i + 1].offset) {
      lower = keyframes[i]
      upper = keyframes[i + 1]
      break
    }
  }
  const span = upper.offset - lower.offset || 1
  const local = (p - lower.offset) / span
  const field = (key: keyof SampledFrame) => {
    const a = lower.transform[key] ?? REST[key]
    const b = upper.transform[key] ?? REST[key]
    return lerp(a, b, local)
  }
  return {
    x: field('x'),
    y: field('y'),
    rotation: field('rotation'),
    scale: field('scale'),
    opacity: field('opacity'),
  }
}

export function frameToCss(frame: SampledFrame): {
  transform: string
  opacity: number
} {
  return {
    transform: `translate(${frame.x}px, ${frame.y}px) rotate(${frame.rotation}deg) scale(${frame.scale})`,
    opacity: frame.opacity,
  }
}

function preset(
  id: string,
  name: string,
  category: AnimationCategory,
  defaultDurationMs: number,
  keyframes: Keyframe[],
): AnimationPreset {
  return {
    id,
    name,
    category,
    keyframes,
    defaultDurationMs,
    defaultEasing: category === 'attention' ? 'easeInOut' : 'easeOut',
  }
}
