'use client'

// Resizable + collapsible side panel. Width and collapsed state persist to
// localStorage; respects min/max. Used for both the left and right panels.

import { useEffect, useRef, useState } from 'react'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function ResizablePanel({
  side,
  storageKey,
  defaultWidth,
  min = 200,
  max = 480,
  children,
}: {
  side: 'left' | 'right'
  storageKey: string
  defaultWidth: number
  min?: number
  max?: number
  children: React.ReactNode
}) {
  const [width, setWidth] = useState(defaultWidth)
  const [collapsed, setCollapsed] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      try {
        const v = JSON.parse(raw)
        if (typeof v.width === 'number') setWidth(v.width)
        setCollapsed(Boolean(v.collapsed))
      } catch {}
    }
    loaded.current = true
  }, [storageKey])

  useEffect(() => {
    if (loaded.current) localStorage.setItem(storageKey, JSON.stringify({ width, collapsed }))
  }, [storageKey, width, collapsed])

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      setWidth(clamp(side === 'left' ? startW + dx : startW - dx, min, max))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden bg-background transition-[width] duration-200 ease-out',
        side === 'left' ? 'border-r' : 'border-l',
      )}
      style={{ width: collapsed ? 36 : width }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'absolute top-2 z-10 grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted [&_svg]:size-4',
          side === 'left' ? 'right-1.5' : 'left-1.5',
        )}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
      </button>

      {!collapsed && (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
          <div
            onPointerDown={startResize}
            className={cn(
              'absolute top-0 bottom-0 z-20 w-1.5 cursor-col-resize hover:bg-primary/40',
              side === 'left' ? '-right-0.5' : '-left-0.5',
            )}
          />
        </>
      )}
    </div>
  )
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
