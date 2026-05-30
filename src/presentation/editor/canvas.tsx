'use client'

// Canvas-first workspace. A gray infinite surface with the slide floating in
// the center. Pan by dragging empty space, zoom with the wheel (toward the
// cursor), fit-to-screen / fit-to-width, rulers, optional grid, snap-to-grid
// and snap-to-element with alignment guides, plus a safe-area overlay.
// Editing never scrolls the browser — all navigation is pan + zoom.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GridIcon,
  MaximizeIcon,
  MoveHorizontalIcon,
  RulerIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { createCenteredLayer, getComponent, LayerView } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'
import type { Layer, Slide, Transform } from '../types'

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'rotate' | 'move'
type View = { zoom: number; panX: number; panY: number }
type Options = { grid: boolean; snap: boolean; rulers: boolean; safe: boolean }

const GRID = 20
const SNAP_PX = 6
const RULER = 22
const SAFE = 0.05

export function Canvas({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const selected = useEditorStore(store, (s) => s.selectedLayerIds)
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]

  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const [view, setView] = useState<View>({ zoom: 0.5, panX: 0, panY: 0 })
  const [opts, setOpts] = useState<Options>({
    grid: false,
    snap: true,
    rulers: true,
    safe: false,
  })
  const [guides, setGuides] = useState<{ vx: number[]; hy: number[] }>({
    vx: [],
    hy: [],
  })
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(null)
  const didFit = useRef(false)

  const fitScreen = useCallback(
    (w = size.w, h = size.h) => {
      const zoom = clamp(
        Math.min((w - 96) / project.width, (h - 96) / project.height),
        0.05,
        4,
      )
      setView({
        zoom,
        panX: (w - project.width * zoom) / 2,
        panY: (h - project.height * zoom) / 2,
      })
    },
    [project.width, project.height, size.w, size.h],
  )

  const fitWidth = useCallback(() => {
    const zoom = clamp((size.w - 96) / project.width, 0.05, 4)
    setView({ zoom, panX: (size.w - project.width * zoom) / 2, panY: 48 })
  }, [project.width, size.w])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const next = { w: el.clientWidth, h: el.clientHeight }
      setSize(next)
      if (!didFit.current && next.w > 1) {
        didFit.current = true
        fitScreen(next.w, next.h)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitScreen])

  // Wheel: ctrl/cmd (or trackpad pinch, which sends ctrlKey) zooms toward the
  // cursor; otherwise it pans. Attached non-passively so preventDefault stops
  // the browser from zooming the whole page.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const factor = Math.exp(-e.deltaY * 0.01)
        setView((v) => {
          const zoom = clamp(v.zoom * factor, 0.05, 4)
          const k = zoom / v.zoom
          return { zoom, panX: cx - (cx - v.panX) * k, panY: cy - (cy - v.panY) * k }
        })
      } else {
        setView((v) => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Drop an element dragged from the sidebar onto the canvas at the cursor.
  function onDrop(e: React.DragEvent) {
    const type = e.dataTransfer.getData('application/x-deck-element')
    if (!type) return
    e.preventDefault()
    const rect = wrapRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - view.panX) / view.zoom
    const wy = (e.clientY - rect.top - view.panY) / view.zoom
    const l = createCenteredLayer(type, project)
    if (!l) return
    l.transform.x = Math.round(wx - l.transform.width / 2)
    l.transform.y = Math.round(wy - l.transform.height / 2)
    store.addLayer(l)
  }

  // Drag empty space = pan; click without drag = deselect.
  function onBackgroundPointerDown(e: React.PointerEvent) {
    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved && Math.hypot(dx, dy) > 3) moved = true
      setView((v) => ({ ...v, panX: v.panX + ev.movementX, panY: v.panY + ev.movementY }))
    }
    const onUp = () => {
      if (!moved) store.clearSelection()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function startGesture(e: React.PointerEvent, layer: Layer, handle: Handle) {
    if (layer.locked) return
    e.stopPropagation()
    store.select(e.shiftKey ? [...new Set([...selected, layer.id])] : [layer.id])
    store.beginTransaction()
    const startX = e.clientX
    const startY = e.clientY
    const base = layer.transform
    const others = slide.layers.filter(
      (l) => l.id !== layer.id && !l.hidden,
    )

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / view.zoom
      const dy = (ev.clientY - startY) / view.zoom
      let next = applyGesture(base, handle, dx, dy)
      if (handle === 'move') {
        const snapped = computeSnap(
          { ...base, x: next.x ?? base.x, y: next.y ?? base.y },
          others,
          project.width,
          project.height,
          opts,
          SNAP_PX / view.zoom,
        )
        next = { x: snapped.x, y: snapped.y }
        setGuides({ vx: snapped.vx, hy: snapped.hy })
      }
      store.liveTransform(layer.id, next)
    }
    const onUp = () => {
      store.commitTransaction()
      setGuides({ vx: [], hy: [] })
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const sw = project.width
  const sh = project.height

  return (
    <div
      ref={wrapRef}
      className="relative flex-1 touch-none overflow-hidden bg-muted/60"
      onPointerDown={onBackgroundPointerDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Scene */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
      >
        <div
          className="relative shadow-2xl"
          style={{ width: sw, height: sh, background: slide.background }}
        >
          {opts.grid && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, color-mix(in oklch, var(--foreground) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 12%, transparent) 1px, transparent 1px)',
                backgroundSize: `${GRID}px ${GRID}px`,
              }}
            />
          )}

          {slide.layers.map((layer) =>
            layer.hidden ? null : (
              <LayerBox
                key={layer.id}
                layer={layer}
                zoom={view.zoom}
                selected={selected.includes(layer.id)}
                onStart={startGesture}
                onUpdate={(patch) => store.patchLayer(layer.id, patch)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  store.select([layer.id])
                  setMenu({ x: e.clientX, y: e.clientY, id: layer.id })
                }}
              />
            ),
          )}

          {/* Dim everything outside the sheet (highlights the in-canvas area). */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: '0 0 0 100000px rgba(9, 9, 14, 0.55)' }}
          />

          {opts.safe && (
            <div
              className="pointer-events-none absolute border border-dashed border-sky-400/70"
              style={{
                left: sw * SAFE,
                top: sh * SAFE,
                width: sw * (1 - 2 * SAFE),
                height: sh * (1 - 2 * SAFE),
              }}
            />
          )}

          {guides.vx.map((x, i) => (
            <div
              key={`v${i}`}
              className="pointer-events-none absolute top-0 bg-pink-500"
              style={{ left: x, width: 1 / view.zoom, height: sh }}
            />
          ))}
          {guides.hy.map((y, i) => (
            <div
              key={`h${i}`}
              className="pointer-events-none absolute left-0 bg-pink-500"
              style={{ top: y, height: 1 / view.zoom, width: sw }}
            />
          ))}
        </div>
      </div>

      {opts.rulers && (
        <>
          <Ruler orientation="x" view={view} length={size.w} />
          <Ruler orientation="y" view={view} length={size.h} />
          <div
            className="pointer-events-none absolute top-0 left-0 border-r border-b bg-background"
            style={{ width: RULER, height: RULER }}
          />
        </>
      )}

      <ViewControls
        view={view}
        opts={opts}
        setOpts={setOpts}
        onZoom={(f) =>
          setView((v) => {
            const zoom = clamp(v.zoom * f, 0.05, 4)
            const cx = size.w / 2
            const cy = size.h / 2
            const k = zoom / v.zoom
            return { zoom, panX: cx - (cx - v.panX) * k, panY: cy - (cy - v.panY) * k }
          })
        }
        onFitScreen={() => fitScreen()}
        onFitWidth={fitWidth}
      />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          layer={slide.layers.find((l) => l.id === menu.id)}
          store={store}
          slide={slide}
          close={() => setMenu(null)}
        />
      )}
    </div>
  )
}

function LayerBox({
  layer,
  zoom,
  selected,
  onStart,
  onUpdate,
  onContextMenu,
}: {
  layer: Layer
  zoom: number
  selected: boolean
  onStart: (e: React.PointerEvent, layer: Layer, handle: Handle) => void
  onUpdate: (patch: Partial<Layer>) => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const t = layer.transform
  const hs = 10 / zoom
  // Interactive content (e.g. a selected code block) captures pointer input so
  // it can scroll; it's then moved via the dedicated grip instead of the body.
  const interactive = selected && !!getComponent(layer.type)?.interactive
  return (
    <div
      className="absolute"
      style={{
        left: t.x,
        top: t.y,
        width: t.width,
        height: t.height,
        opacity: t.opacity,
        transform: `rotate(${t.rotation}deg) scale(${t.scale})`,
        outline: selected ? `${2 / zoom}px solid var(--primary)` : undefined,
        cursor: layer.locked ? 'default' : 'move',
      }}
      onPointerDown={interactive ? undefined : (e) => onStart(e, layer, 'move')}
      onContextMenu={onContextMenu}
    >
      <div
        className="h-full w-full"
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      >
        <LayerView layer={layer} mode="editor" selected={selected} update={onUpdate} />
      </div>

      {selected && !layer.locked && (
        <>
          {/* Move grip (keeps interactive layers movable) */}
          <div
            onPointerDown={(e) => onStart(e, layer, 'move')}
            className="absolute left-1/2 z-10 rounded-full bg-primary"
            style={{ top: -16 / zoom, width: 26 / zoom, height: 7 / zoom, transform: 'translateX(-50%)', cursor: 'move' }}
            title="Move"
          />
          {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
            <div
              key={h}
              onPointerDown={(e) => onStart(e, layer, h)}
              className="absolute z-10 rounded-full border border-primary bg-background"
              style={{ width: hs, height: hs, ...handlePos(h) }}
            />
          ))}
          <div
            onPointerDown={(e) => onStart(e, layer, 'rotate')}
            className="absolute z-10 rounded-full border border-primary bg-background"
            style={{ width: hs, height: hs, left: '50%', top: -32 / zoom, transform: 'translateX(-50%)', cursor: 'grab' }}
          />
        </>
      )}
    </div>
  )
}

function Ruler({
  orientation,
  view,
  length,
}: {
  orientation: 'x' | 'y'
  view: View
  length: number
}) {
  const isX = orientation === 'x'
  const pan = isX ? view.panX : view.panY
  const step = niceStep(view.zoom)
  const start = Math.floor(-pan / view.zoom / step) * step
  const ticks: { pos: number; value: number }[] = []
  for (let world = start, n = 0; n < 400; world += step, n++) {
    const pos = world * view.zoom + pan
    if (pos > length) break
    if (pos >= RULER) ticks.push({ pos, value: world })
  }
  return (
    <div
      className="pointer-events-none absolute z-20 overflow-hidden border-border bg-background/90 text-[9px] text-muted-foreground"
      style={
        isX
          ? { top: 0, left: RULER, right: 0, height: RULER, borderBottomWidth: 1 }
          : { top: RULER, left: 0, bottom: 0, width: RULER, borderRightWidth: 1 }
      }
    >
      {ticks.map(({ pos, value }) => (
        <div
          key={value}
          className="absolute"
          style={
            isX
              ? { left: pos - RULER, top: 0, height: '100%' }
              : { top: pos - RULER, left: 0, width: '100%' }
          }
        >
          <span
            className="absolute"
            style={isX ? { left: 2, top: 1 } : { top: 1, left: 1, writingMode: 'vertical-rl' }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

function ViewControls({
  view,
  opts,
  setOpts,
  onZoom,
  onFitScreen,
  onFitWidth,
}: {
  view: View
  opts: Options
  setOpts: (fn: (o: Options) => Options) => void
  onZoom: (factor: number) => void
  onFitScreen: () => void
  onFitWidth: () => void
}) {
  return (
    <div className="absolute right-3 bottom-3 z-30 flex items-center gap-1 rounded-lg border bg-background/95 p-1 shadow-md">
      <Ctrl onClick={() => onZoom(0.83)} title="Zoom out">
        <ZoomOutIcon />
      </Ctrl>
      <span className="w-10 text-center text-xs tabular-nums">
        {Math.round(view.zoom * 100)}%
      </span>
      <Ctrl onClick={() => onZoom(1.2)} title="Zoom in">
        <ZoomInIcon />
      </Ctrl>
      <Ctrl onClick={onFitScreen} title="Fit to screen">
        <MaximizeIcon />
      </Ctrl>
      <Ctrl onClick={onFitWidth} title="Fit to width">
        <MoveHorizontalIcon />
      </Ctrl>
      <Ctrl
        active={opts.grid}
        onClick={() => setOpts((o) => ({ ...o, grid: !o.grid }))}
        title="Grid"
      >
        <GridIcon />
      </Ctrl>
      <Ctrl
        active={opts.rulers}
        onClick={() => setOpts((o) => ({ ...o, rulers: !o.rulers }))}
        title="Rulers"
      >
        <RulerIcon />
      </Ctrl>
    </div>
  )
}

function Ctrl({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'grid size-7 place-items-center rounded-md hover:bg-muted [&_svg]:size-4',
        active && 'bg-muted text-primary',
      )}
    >
      {children}
    </button>
  )
}

// --- geometry helpers ------------------------------------------------------

function applyGesture(
  base: Transform,
  handle: Handle,
  dx: number,
  dy: number,
): Partial<Transform> {
  switch (handle) {
    case 'move':
      return { x: base.x + dx, y: base.y + dy }
    case 'se':
      return { width: Math.max(20, base.width + dx), height: Math.max(20, base.height + dy) }
    case 'sw':
      return { x: base.x + dx, width: Math.max(20, base.width - dx), height: Math.max(20, base.height + dy) }
    case 'ne':
      return { y: base.y + dy, width: Math.max(20, base.width + dx), height: Math.max(20, base.height - dy) }
    case 'nw':
      return { x: base.x + dx, y: base.y + dy, width: Math.max(20, base.width - dx), height: Math.max(20, base.height - dy) }
    case 'rotate':
      return { rotation: base.rotation + dx }
  }
}

function computeSnap(
  t: Transform,
  others: Layer[],
  sw: number,
  sh: number,
  opts: Options,
  threshold: number,
): { x: number; y: number; vx: number[]; hy: number[] } {
  let { x, y } = t
  if (opts.grid && opts.snap) {
    x = Math.round(x / GRID) * GRID
    y = Math.round(y / GRID) * GRID
  }
  const vx: number[] = []
  const hy: number[] = []
  if (!opts.snap) return { x, y, vx, hy }

  const xTargets = [0, sw / 2, sw, ...others.flatMap((l) => [l.transform.x, l.transform.x + l.transform.width / 2, l.transform.x + l.transform.width])]
  const yTargets = [0, sh / 2, sh, ...others.flatMap((l) => [l.transform.y, l.transform.y + l.transform.height / 2, l.transform.y + l.transform.height])]

  const xPoints = [x, x + t.width / 2, x + t.width]
  for (let i = 0; i < xPoints.length; i++) {
    for (const target of xTargets) {
      if (Math.abs(xPoints[i] - target) < threshold) {
        x += target - xPoints[i]
        vx.push(target)
        break
      }
    }
    if (vx.length) break
  }
  const yPoints = [y, y + t.height / 2, y + t.height]
  for (let i = 0; i < yPoints.length; i++) {
    for (const target of yTargets) {
      if (Math.abs(yPoints[i] - target) < threshold) {
        y += target - yPoints[i]
        hy.push(target)
        break
      }
    }
    if (hy.length) break
  }
  return { x, y, vx, hy }
}

function handlePos(h: Handle): React.CSSProperties {
  const c: React.CSSProperties = { transform: 'translate(-50%, -50%)' }
  if (h === 'nw') return { ...c, left: 0, top: 0, cursor: 'nwse-resize' }
  if (h === 'ne') return { ...c, left: '100%', top: 0, cursor: 'nesw-resize' }
  if (h === 'sw') return { ...c, left: 0, top: '100%', cursor: 'nesw-resize' }
  return { ...c, left: '100%', top: '100%', cursor: 'nwse-resize' }
}

function niceStep(zoom: number): number {
  const target = 80 / zoom
  const steps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]
  return steps.find((s) => s >= target) ?? 10000
}

function ContextMenu({
  x,
  y,
  layer,
  store,
  slide,
  close,
}: {
  x: number
  y: number
  layer?: Layer
  store: EditorStore
  slide: Slide
  close: () => void
}) {
  if (!layer) return null
  const index = slide.layers.findIndex((l) => l.id === layer.id)
  const items: { label: string; run: () => void }[] = [
    { label: 'Duplicate', run: () => store.duplicateLayer(layer.id) },
    { label: 'Bring to front', run: () => store.reorderLayer(layer.id, slide.layers.length - 1) },
    { label: 'Send to back', run: () => store.reorderLayer(layer.id, 0) },
    { label: 'Forward', run: () => store.reorderLayer(layer.id, index + 1) },
    { label: 'Backward', run: () => store.reorderLayer(layer.id, index - 1) },
    { label: layer.locked ? 'Unlock' : 'Lock', run: () => store.patchLayer(layer.id, { locked: !layer.locked }) },
    { label: layer.hidden ? 'Show' : 'Hide', run: () => store.patchLayer(layer.id, { hidden: !layer.hidden }) },
    { label: 'Delete', run: () => store.deleteLayer(layer.id) },
  ]
  return (
    <>
      <div className="fixed inset-0 z-40" onPointerDown={close} onContextMenu={(e) => { e.preventDefault(); close() }} />
      <div
        className="fixed z-50 w-44 rounded-lg border bg-popover p-1 text-sm shadow-md"
        style={{ left: x, top: y }}
      >
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              it.run()
              close()
            }}
            className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
          >
            {it.label}
          </button>
        ))}
      </div>
    </>
  )
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
