// Easing functions shared by the animation, morph, and timeline engines.
// All map a normalized time t in [0,1] to an eased value (usually [0,1]).

import type { EasingName } from '../types'

export type EasingFn = (t: number) => number

const easings: Record<EasingName, EasingFn> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  // Lightweight spring/overshoot approximation (no physics state needed).
  spring: (t) => {
    const c = 1.70158 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2
  },
  bounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
}

export function getEasing(name: EasingName): EasingFn {
  return easings[name] ?? easings.linear
}

export function ease(name: EasingName, t: number): number {
  return getEasing(name)(clamp01(t))
}

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
