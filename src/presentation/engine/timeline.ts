// Timeline engine. Turns a slide's per-layer animations into an absolute
// schedule (supporting sequential/parallel ordering, delays and repeats) and
// samples the composed animation state at any point in time.

import type { ID, Slide } from '../types'
import { ease } from './easing'
import {
  getPreset,
  sampleKeyframes,
  type SampledFrame,
} from './animation'

export type ScheduledAnimation = {
  layerId: ID
  presetId: string
  startMs: number
  endMs: number
  durationMs: number
  easing: import('../types').EasingName
  category: import('../types').AnimationCategory
  repeat: number
}

const REST: SampledFrame = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }

// Build an absolute schedule for a slide's enter/attention animations.
export function scheduleSlide(slide: Slide): ScheduledAnimation[] {
  const scheduled: ScheduledAnimation[] = []
  let cursor = 0 // end of the previous animation (for "after-previous")
  let prevStart = 0

  for (const layer of slide.layers) {
    for (const anim of layer.animations) {
      if (anim.trigger === 'slide-exit' || anim.trigger === 'click') continue
      const preset = getPreset(anim.presetId)
      if (!preset) continue

      let start: number
      if (anim.trigger === 'with-previous') start = prevStart + anim.delayMs
      else if (anim.trigger === 'after-previous') start = cursor + anim.delayMs
      else start = anim.delayMs // slide-enter

      const reps = Math.max(0, anim.repeat) + 1
      const total = anim.durationMs * reps
      scheduled.push({
        layerId: layer.id,
        presetId: anim.presetId,
        startMs: start,
        endMs: start + total,
        durationMs: anim.durationMs,
        easing: anim.easing,
        category: preset.category,
        repeat: anim.repeat,
      })
      prevStart = start
      cursor = Math.max(cursor, start + total)
    }
  }
  return scheduled
}

export function timelineDuration(scheduled: ScheduledAnimation[]): number {
  return scheduled.reduce((max, s) => Math.max(max, s.endMs), 0)
}

// Compose all animation overlays for each layer at the given time.
export function sampleAt(
  scheduled: ScheduledAnimation[],
  timeMs: number,
): Record<ID, SampledFrame> {
  const out: Record<ID, SampledFrame> = {}

  for (const s of scheduled) {
    const preset = getPreset(s.presetId)
    if (!preset) continue

    let p: number
    if (timeMs < s.startMs) {
      // Entrance animations hold their initial (hidden) frame until they start.
      p = 0
    } else if (timeMs >= s.endMs) {
      p = s.category === 'attention' ? 0 : 1
    } else {
      const local = (timeMs - s.startMs) % s.durationMs
      p = ease(s.easing, local / s.durationMs)
    }

    const frame = sampleKeyframes(preset.keyframes, p)
    out[s.layerId] = compose(out[s.layerId] ?? REST, frame)
  }

  return out
}

function compose(a: SampledFrame, b: SampledFrame): SampledFrame {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    rotation: a.rotation + b.rotation,
    scale: a.scale * b.scale,
    opacity: a.opacity * b.opacity,
  }
}
