// Morphing engine (Snappify-style shared-element transitions).
// Given two consecutive slides it matches elements, then interpolates position,
// size, rotation, opacity, scale, border-radius and colors automatically — no
// manual animation authoring required.

import type { ID, Layer, Slide, Transform } from '../types'
import { clamp01, lerp } from './easing'

export type MorphItem = {
  key: string
  layer: Layer
  transform: Transform
  // Animated style fields that the renderer should override (radius/colors).
  borderRadius?: number
  fill?: string
  color?: string
  opacity: number
  // Data override (e.g. interpolated code `visibleRange` for smooth scrolling).
  data?: Record<string, unknown>
}

export type MorphPlan = {
  shared: { from: Layer; to: Layer }[]
  entering: Layer[]
  exiting: Layer[]
}

// Match key: explicit shared-element key wins, else fall back to type+name so
// elements that "feel" like the same thing across slides are matched.
function keyOf(layer: Layer): string {
  return layer.morphKey ?? `${layer.type}:${layer.name}`
}

export function buildMorphPlan(from: Slide, to: Slide): MorphPlan {
  const fromMap = new Map<string, Layer>()
  for (const l of from.layers) fromMap.set(keyOf(l), l)
  const toMap = new Map<string, Layer>()
  for (const l of to.layers) toMap.set(keyOf(l), l)

  const shared: MorphPlan['shared'] = []
  const entering: Layer[] = []
  const exiting: Layer[] = []

  for (const [key, toLayer] of toMap) {
    const fromLayer = fromMap.get(key)
    if (fromLayer) shared.push({ from: fromLayer, to: toLayer })
    else entering.push(toLayer)
  }
  for (const [key, fromLayer] of fromMap) {
    if (!toMap.has(key)) exiting.push(fromLayer)
  }

  return { shared, entering, exiting }
}

// Sample the whole transition at eased progress t (0..1).
export function sampleMorph(plan: MorphPlan, t: number): MorphItem[] {
  const items: MorphItem[] = []

  for (const { from, to } of plan.shared) {
    items.push({
      key: to.id,
      layer: to,
      transform: lerpTransform(from.transform, to.transform, t),
      borderRadius: lerpMaybe(
        from.style.borderRadius,
        to.style.borderRadius,
        t,
      ),
      fill: lerpColor(from.style.fill, to.style.fill, t),
      color: lerpColor(from.style.color, to.style.color, t),
      opacity: lerp(from.transform.opacity, to.transform.opacity, t),
      data: lerpCodeRange(from, to, t),
    })
  }

  // Exiting elements fade/scale out over the first half.
  const exitT = clamp01(t / 0.5)
  for (const layer of plan.exiting) {
    items.push({
      key: `exit:${layer.id}`,
      layer,
      transform: { ...layer.transform, scale: lerp(1, 0.96, exitT) },
      opacity: layer.transform.opacity * (1 - exitT),
    })
  }

  // Entering elements fade/scale in over the second half.
  const enterT = clamp01((t - 0.5) / 0.5)
  for (const layer of plan.entering) {
    items.push({
      key: layer.id,
      layer,
      transform: { ...layer.transform, scale: lerp(0.96, 1, enterT) },
      opacity: layer.transform.opacity * enterT,
    })
  }

  return items
}

// For matched code blocks, interpolate the visible-line window so the code
// smoothly scrolls (Snappify-style) in sync with the morph progress.
function lerpCodeRange(
  from: Layer,
  to: Layer,
  t: number,
): Record<string, unknown> | undefined {
  if (from.type !== 'code' || to.type !== 'code') return undefined
  const fr = from.data.visibleRange as [number, number] | undefined
  const tr = to.data.visibleRange as [number, number] | undefined
  if (!fr || !tr) return undefined
  return {
    ...to.data,
    visibleRange: [lerp(fr[0], tr[0], t), lerp(fr[1], tr[1], t)],
  }
}

function lerpTransform(a: Transform, b: Transform, t: number): Transform {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
    rotation: lerp(a.rotation, b.rotation, t),
    scale: lerp(a.scale, b.scale, t),
    opacity: lerp(a.opacity, b.opacity, t),
  }
}

function lerpMaybe(
  a: number | undefined,
  b: number | undefined,
  t: number,
): number | undefined {
  if (a == null && b == null) return undefined
  return lerp(a ?? b ?? 0, b ?? a ?? 0, t)
}

// --- Color interpolation (hex / rgb[a]) ---

type RGBA = { r: number; g: number; b: number; a: number }

function lerpColor(
  a: string | undefined,
  b: string | undefined,
  t: number,
): string | undefined {
  if (!a && !b) return undefined
  const ca = parseColor(a ?? b!)
  const cb = parseColor(b ?? a!)
  if (!ca || !cb) return t < 0.5 ? a : b
  const r = Math.round(lerp(ca.r, cb.r, t))
  const g = Math.round(lerp(ca.g, cb.g, t))
  const bl = Math.round(lerp(ca.b, cb.b, t))
  const al = lerp(ca.a, cb.a, t)
  return `rgba(${r}, ${g}, ${bl}, ${al})`
}

function parseColor(input: string): RGBA | null {
  const value = input.trim()
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    }
  }
  const rgb = value.match(/rgba?\(([^)]+)\)/i)
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => parseFloat(p))
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 }
  }
  return null
}

// Convenience for callers that only need the matched id set.
export function morphedLayerIds(plan: MorphPlan): ID[] {
  return plan.shared.map((p) => p.to.id)
}
