'use client'

// Interactive CSS Flexbox demonstration. Controls change the container's flex
// properties live and the boxes animate to their new positions via FLIP, so it
// works as a live teaching element inside both the editor and the runtime.

import { useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type FlexDemoData = {
  items?: number
  direction?: string
  justify?: string
  align?: string
  gap?: number
  wrap?: string
}

const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around']
const ALIGN = ['flex-start', 'center', 'flex-end', 'stretch']
const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']

export function FlexDemo({
  data,
  interactive = true,
}: {
  data: FlexDemoData
  interactive?: boolean
}) {
  const [direction, setDirection] = useState<string>(data.direction ?? 'row')
  const [justify, setJustify] = useState<string>(data.justify ?? 'flex-start')
  const [align, setAlign] = useState<string>(data.align ?? 'stretch')
  const [gap, setGap] = useState<number>(data.gap ?? 12)
  const [wrap, setWrap] = useState<string>(data.wrap ?? 'nowrap')
  const n = data.items ?? 4

  const stageRef = useRef<HTMLDivElement>(null)
  const prev = useRef<Map<Element, DOMRect>>(new Map())

  // FLIP: animate boxes from their previous positions to the new layout.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    for (const el of Array.from(stage.children)) {
      const next = el.getBoundingClientRect()
      const p = prev.current.get(el)
      if (p) {
        const dx = p.left - next.left
        const dy = p.top - next.top
        if (dx || dy) {
          ;(el as HTMLElement).animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0,0)' }],
            { duration: 350, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
          )
        }
      }
      prev.current.set(el, next)
    }
  }, [direction, justify, align, gap, wrap, n])

  return (
    <div
      className="flex h-full w-full flex-col gap-3 rounded-xl border bg-card/60 p-3 text-card-foreground"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {interactive && (
        <div className="flex flex-wrap gap-3 text-[11px]">
          <Control label="flex-direction" value={direction} set={setDirection} options={['row', 'column']} />
          <Control label="justify-content" value={justify} set={setJustify} options={JUSTIFY} />
          <Control label="align-items" value={align} set={setAlign} options={ALIGN} />
          <Control label="flex-wrap" value={wrap} set={setWrap} options={['nowrap', 'wrap']} />
          <label className="flex flex-col gap-0.5">
            <span className="opacity-60">gap: {gap}px</span>
            <input type="range" min={0} max={48} value={gap} onChange={(e) => setGap(Number(e.target.value))} />
          </label>
        </div>
      )}

      <div
        ref={stageRef}
        className="flex flex-1 overflow-hidden rounded-lg bg-background/50 p-2"
        style={{
          flexDirection: direction as React.CSSProperties['flexDirection'],
          justifyContent: justify,
          alignItems: align,
          gap,
          flexWrap: wrap as React.CSSProperties['flexWrap'],
        }}
      >
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="grid place-items-center rounded-md font-semibold text-white shadow"
            style={{
              background: COLORS[i % COLORS.length],
              width: 56,
              minWidth: 56,
              height: align === 'stretch' ? undefined : 48 + (i % 3) * 18,
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

function Control({
  label,
  value,
  set,
  options,
}: {
  label: string
  value: string
  set: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="opacity-60">{label}</span>
      <div className="flex flex-wrap gap-0.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => set(o)}
            className={cn(
              'rounded border px-1.5 py-0.5',
              value === o ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
