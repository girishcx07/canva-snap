'use client'

// Presentation runtime. A dedicated player (separate from the editor) that
// drives slide navigation, morph transitions between consecutive slides, the
// per-slide timeline of entrance animations, and event execution.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExpandIcon, XIcon } from 'lucide-react'

import { ease } from '../engine/easing'
import { buildMorphPlan, sampleMorph, type MorphItem } from '../engine/morph'
import { scheduleSlideSteps, sampleStepsAt } from '../engine/timeline'
import { getPreset, sampleKeyframes, type SampledFrame } from '../engine/animation'
import { fireTrigger, runActions, type ActionContext } from '../engine/events'
import { LayerView, extraTransform } from '../registry'
import type { ID, Layer, Project, Transform } from '../types'

const REST: SampledFrame = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }

export function Player({
  project,
  initialIndex = 0,
  onExit,
}: {
  project: Project
  initialIndex?: number
  onExit?: () => void
}) {
  const [nav, setNav] = useState({
    index: initialIndex,
    from: initialIndex,
    progress: 1, // morph progress (1 = settled)
  })
  const [clickStep, setClickStep] = useState(0)
  const [frames, setFrames] = useState<Record<ID, SampledFrame>>({})
  const [stepAnim, setStepAnim] = useState<{ step: number; startMs: number; durationMs: number } | null>(null)
  const [overrides, setOverrides] = useState<Record<ID, boolean>>({})
  const stateRef = useRef<Record<string, unknown>>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const slide = project.slides[nav.index]
  const fromSlide = project.slides[nav.from]

  if (typeof window !== 'undefined') {
    (window as any)._activeProject = project
    (window as any)._activeSlide = slide
  }

  const steps = useMemo(() => scheduleSlideSteps(slide), [slide])

  const go = useCallback(
    (target: 'next' | 'prev' | number) => {
      setNav((n) => {
        const next =
          target === 'next'
            ? n.index + 1
            : target === 'prev'
              ? n.index - 1
              : target
        const clamped = Math.max(0, Math.min(next, project.slides.length - 1))
        if (clamped === n.index) return n
        setOverrides({})
        return { index: clamped, from: n.index, progress: 0 }
      })
    },
    [project.slides.length],
  )

  const triggerNext = useCallback(() => {
    if (clickStep < steps.length - 1) {
      const nextStep = clickStep + 1
      setClickStep(nextStep)
      setStepAnim({
        step: nextStep,
        startMs: performance.now(),
        durationMs: steps[nextStep]?.durationMs ?? 0,
      })
    } else {
      go('next')
    }
  }, [clickStep, steps, go])

  // Reset steps and start step 0 on slide change
  useEffect(() => {
    setClickStep(0)
    setStepAnim(null)
  }, [nav.index])

  // Drive the morph transition and then start the step 0 animation
  useEffect(() => {
    const morphMs =
      nav.from === nav.index || slide.transition.type === 'none'
        ? 0
        : slide.transition.durationMs

    const start = performance.now()
    let raf = 0

    const loop = (t: number) => {
      const elapsed = t - start
      if (elapsed < morphMs) {
        setNav((n) => ({ ...n, progress: elapsed / morphMs }))
        raf = requestAnimationFrame(loop)
        return
      }
      
      // Morph transition has finished
      setNav((n) => (n.progress >= 1 ? n : { ...n, progress: 1 }))
      
      // Initialize active step 0 animation
      setStepAnim((prev) => {
        if (prev && prev.step === 0) return prev
        return { step: 0, startMs: performance.now(), durationMs: steps[0]?.durationMs ?? 0 }
      })
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [nav.index, nav.from, slide, steps])

  // Drive local step animations
  useEffect(() => {
    if (!stepAnim || stepAnim.step !== clickStep) return

    let raf = 0
    const start = stepAnim.startMs
    const dur = stepAnim.durationMs

    const loop = (t: number) => {
      const elapsed = t - start
      
      setFrames(sampleStepsAt(steps, clickStep, elapsed))

      if (elapsed < dur) {
        raf = requestAnimationFrame(loop)
      } else {
        setFrames(sampleStepsAt(steps, clickStep, dur))
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stepAnim, clickStep, steps])

  // Event runtime context.
  const ctx = useMemo<ActionContext>(
    () => ({
      showLayer: (id) => setOverrides((o) => ({ ...o, [id]: true })),
      hideLayer: (id) => setOverrides((o) => ({ ...o, [id]: false })),
      animateLayer: (id, presetId, options) => {
        const preset = getPreset(presetId)
        if (!preset) return
        const duration = options?.durationMs ?? preset.defaultDurationMs
        const delay = options?.delayMs ?? 0
        const easing = options?.easing ?? preset.defaultEasing ?? 'easeOut'
        const start = performance.now()
        const loop = (t: number) => {
          const elapsed = t - start
          if (elapsed < delay) {
            requestAnimationFrame(loop)
            return
          }
          
          const activeElapsed = elapsed - delay
          const p = Math.min(1, activeElapsed / duration)
          const eased = ease(easing, p)
          const frame = sampleKeyframes(preset.keyframes, eased)
          
          setFrames((prev) => ({
            ...prev,
            [id]: frame,
          }))
          
          if (p < 1) {
            requestAnimationFrame(loop)
          } else {
            const isAttention = preset.category === 'attention'
            setFrames((prev) => ({
              ...prev,
              [id]: isAttention ? REST : frame,
            }))
          }
        }
        requestAnimationFrame(loop)
      },
      changeState: (key, value) => {
        stateRef.current[key] = value
      },
      startTimeline: () => setNav((n) => ({ ...n, progress: 1 })),
      navigateSlide: (target) => go(target),
      triggerSequence: () => {},
    }),
    [go],
  )

  // Fire slide-enter events when the slide changes.
  useEffect(() => {
    const bindings = slide.layers.flatMap((l) =>
      l.events.map((binding) => ({ layerId: l.id, binding })),
    )
    void fireTrigger(bindings, 'slide-enter', ctx)
  }, [nav.index, slide, ctx])

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') triggerNext()
      else if (e.key === 'ArrowLeft') go('prev')
      else if (e.key === 'Escape') onExit?.()
      else {
        const bindings = slide.layers.flatMap((l) =>
          l.events
            .filter(
              (b) => b.trigger === 'keyboard' && b.triggerParams?.key === e.key,
            )
            .map((binding) => ({ layerId: l.id, binding })),
        )
        void fireTrigger(bindings, 'keyboard', ctx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, triggerNext, onExit, slide, ctx])

  const onLayerClick = (layer: Layer) => onLayerTrigger(layer, 'click')
  const onLayerTrigger = (layer: Layer, trigger: 'click' | 'hover') => {
    const bindings = layer.events.filter((b) => b.trigger === trigger)
    if (bindings.length === 0) return
    void runActions(
      bindings.flatMap((b) => b.actions),
      ctx,
      layer.id,
    )
  }

  const morphing = nav.progress < 1 && slide.transition.type !== 'none'
  const morphItems = useMemo<MorphItem[] | null>(() => {
    if (!morphing) return null
    if (slide.transition.type !== 'morph') return null
    return sampleMorph(
      buildMorphPlan(fromSlide, slide),
      ease(slide.transition.easing, nav.progress),
    )
  }, [morphing, fromSlide, slide, nav.progress])

  const scale = useStageScale(project)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={() => go('next')}
    >
      <div
        style={{
          width: project.width,
          height: project.height,
          transform: `scale(${scale})`,
          background: slide.background,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {morphItems
          ? morphItems.map((item) => (
              <RenderedLayer
                key={item.key}
                layer={withMorph(item)}
                transform={item.transform}
                opacityOverride={item.opacity}
                frame={REST}
              />
            ))
          : slide.layers.map((layer) => {
              const visible = overrides[layer.id] ?? !layer.hidden
              if (!visible) return null
              return (
                <RenderedLayer
                  key={layer.id}
                  layer={layer}
                  transform={layer.transform}
                  frame={frames[layer.id] ?? REST}
                  onClick={(e) => {
                    e.stopPropagation()
                    onLayerClick(layer)
                  }}
                  onMouseEnter={() => onLayerTrigger(layer, 'hover')}
                />
              )
            })}

        {/* cross-fade for non-morph transitions */}
        {morphing && slide.transition.type !== 'morph' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: fromSlide.background,
              opacity: 1 - ease(slide.transition.easing, nav.progress),
            }}
          />
        )}
      </div>

      <Controls
        index={nav.index}
        total={project.slides.length}
        onFullscreen={() => toggleFullscreen(containerRef.current)}
        onExit={onExit}
      />
    </div>
  )
}

function RenderedLayer({
  layer,
  transform,
  frame,
  opacityOverride,
  onClick,
  onMouseEnter,
}: {
  layer: Layer
  transform: Transform
  frame: SampledFrame
  opacityOverride?: number
  onClick?: (e: React.MouseEvent) => void
  onMouseEnter?: () => void
}) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        position: 'absolute',
        left: transform.x,
        top: transform.y,
        width: transform.width,
        height: transform.height,
        transform: `translate(${frame.x}px, ${frame.y}px) rotate(${transform.rotation + frame.rotation}deg) scale(${transform.scale * frame.scale})${extraTransform(layer)}`,
        opacity: (opacityOverride ?? transform.opacity) * frame.opacity,
        pointerEvents: onClick ? 'auto' : 'none',
      }}
    >
      <LayerView layer={layer} mode="present" frame={frame} />
    </div>
  )
}

// Apply morph-animated style/data fields onto the layer before rendering.
function withMorph(item: MorphItem): Layer {
  return {
    ...item.layer,
    data: item.data ?? item.layer.data,
    style: {
      ...item.layer.style,
      ...(item.borderRadius != null ? { borderRadius: item.borderRadius } : {}),
      ...(item.fill ? { fill: item.fill } : {}),
      ...(item.color ? { color: item.color } : {}),
    },
  }
}

function Controls({
  index,
  total,
  onFullscreen,
  onExit,
}: {
  index: number
  total: number
  onFullscreen: () => void
  onExit?: () => void
}) {
  return (
    <div
      className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="tabular-nums">
        {index + 1} / {total}
      </span>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
      <button onClick={onFullscreen} aria-label="Fullscreen">
        <ExpandIcon className="size-4" />
      </button>
      {onExit && (
        <button onClick={onExit} aria-label="Exit">
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )
}

function useStageScale(project: Project): number {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(
        Math.min(
          window.innerWidth / project.width,
          window.innerHeight / project.height,
        ),
      )
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [project.width, project.height])
  return scale
}

function toggleFullscreen(el: HTMLElement | null) {
  if (!el) return
  if (document.fullscreenElement) void document.exitFullscreen()
  else void el.requestFullscreen?.()
}
