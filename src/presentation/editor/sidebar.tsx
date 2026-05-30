'use client'

// Canva-style dual sidebar: an always-visible icon rail plus a collapsible,
// resizable secondary panel whose content depends on the selected rail item.

import { useEffect, useRef, useState } from 'react'
import {
  CodeIcon,
  ImageIcon,
  LayersIcon,
  LayoutTemplateIcon,
  type LucideIcon,
  ShapesIcon,
  SmileIcon,
  SquareIcon,
  TypeIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import type { EditorStore } from '../store'
import { ElementsPalette } from './elements-palette'
import { LayersPanel } from './layers-panel'
import {
  CodePanel,
  IconsPanel,
  ImagesPanel,
  ShapesPanel,
  TemplatesPanel,
  TextPanel,
} from './panels'

type RailId =
  | 'templates'
  | 'elements'
  | 'text'
  | 'code'
  | 'shapes'
  | 'images'
  | 'icons'
  | 'layers'

const RAIL: { id: RailId; label: string; icon: LucideIcon }[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon },
  { id: 'elements', label: 'Elements', icon: ShapesIcon },
  { id: 'text', label: 'Text', icon: TypeIcon },
  { id: 'code', label: 'Code', icon: CodeIcon },
  { id: 'shapes', label: 'Shapes', icon: SquareIcon },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'icons', label: 'Icons', icon: SmileIcon },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
]

export function Sidebar({ store }: { store: EditorStore }) {
  const [active, setActive] = useState<RailId | null>('elements')
  const [width, setWidth] = useState(300)
  const loaded = useRef(false)

  useEffect(() => {
    const raw = localStorage.getItem('deck.sidebar.width')
    if (raw) setWidth(Number(raw) || 300)
    loaded.current = true
  }, [])

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    const onMove = (ev: PointerEvent) => {
      const w = Math.max(240, Math.min(440, startW + ev.clientX - startX))
      setWidth(w)
      localStorage.setItem('deck.sidebar.width', String(w))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-[68px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r bg-background py-2">
        {RAIL.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive((a) => (a === item.id ? null : item.id))}
            className={cn(
              'mx-1.5 flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-medium text-muted-foreground hover:bg-muted',
              active === item.id && 'bg-muted text-primary',
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="relative flex min-h-0 shrink-0 flex-col border-r bg-background"
          style={{ width }}
        >
          <div className="border-b px-3 py-2 text-sm font-semibold capitalize">
            {active}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <PanelContent id={active} store={store} />
          </div>
          <div
            onPointerDown={startResize}
            className="absolute top-0 -right-0.5 bottom-0 z-10 w-1.5 cursor-col-resize hover:bg-primary/40"
          />
        </div>
      )}
    </div>
  )
}

function PanelContent({ id, store }: { id: RailId; store: EditorStore }) {
  switch (id) {
    case 'templates':
      return <TemplatesPanel />
    case 'elements':
      return <ElementsPalette store={store} />
    case 'text':
      return <TextPanel store={store} />
    case 'code':
      return <CodePanel store={store} />
    case 'shapes':
      return <ShapesPanel store={store} />
    case 'images':
      return <ImagesPanel store={store} />
    case 'icons':
      return <IconsPanel store={store} />
    case 'layers':
      return <LayersPanel store={store} />
  }
}
