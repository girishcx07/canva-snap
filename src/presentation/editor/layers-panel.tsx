'use client'

// Layers panel. Layer hierarchy for the current slide with visibility, lock,
// reorder and delete — the management surface for the layer system.

import {
  ChevronDownIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  ChevronUpIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  SparklesIcon,
  Trash2Icon,
  UnlockIcon,
} from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { getComponent } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'

export function LayersPanel({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const selected = useEditorStore(store, (s) => s.selectedLayerIds)
  const [renaming, setRenaming] = useState<string | null>(null)
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]

  // Top layer first (rendered last = visually on top).
  const ordered = [...slide.layers].reverse()

  return (
    <div className="flex flex-col gap-1 overflow-auto pr-1">
      {ordered.length === 0 && (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
          No layers yet. Add one from Elements.
        </p>
      )}
      {ordered.map((layer) => {
        const def = getComponent(layer.type)
        const index = slide.layers.findIndex((l) => l.id === layer.id)
        const last = slide.layers.length - 1
        return (
          <div
            key={layer.id}
            onClick={() => store.select([layer.id])}
            className={cn(
              'group/layer flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm',
              selected.includes(layer.id) ? 'bg-muted' : 'hover:bg-muted/60',
            )}
          >
            {def && <def.icon className="size-3.5 shrink-0 text-muted-foreground" />}
            {renaming === layer.id ? (
              <input
                autoFocus
                defaultValue={layer.name}
                className="flex-1 rounded bg-background px-1 text-sm outline-none ring-1 ring-primary"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  store.patchLayer(layer.id, { name: e.target.value || layer.name })
                  setRenaming(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') setRenaming(null)
                }}
              />
            ) : (
              <span
                className="flex-1 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setRenaming(layer.id)
                }}
              >
                {layer.name}
              </span>
            )}
            {layer.animations.length > 0 && (
              <SparklesIcon
                className="size-3 shrink-0 text-primary"
                aria-label="Has animation"
              />
            )}
            <div className="hidden items-center gap-0.5 group-hover/layer:flex">
              <Mini onClick={() => store.reorderLayer(layer.id, last)} title="Bring to front">
                <ChevronsUpIcon />
              </Mini>
              <Mini onClick={() => store.reorderLayer(layer.id, index + 1)} title="Forward">
                <ChevronUpIcon />
              </Mini>
              <Mini onClick={() => store.reorderLayer(layer.id, index - 1)} title="Backward">
                <ChevronDownIcon />
              </Mini>
              <Mini onClick={() => store.reorderLayer(layer.id, 0)} title="Send to back">
                <ChevronsDownIcon />
              </Mini>
              <Mini onClick={() => store.duplicateLayer(layer.id)} title="Duplicate">
                <CopyIcon />
              </Mini>
              <Mini onClick={() => store.deleteLayer(layer.id)} title="Delete">
                <Trash2Icon />
              </Mini>
            </div>
            <Mini onClick={() => store.patchLayer(layer.id, { locked: !layer.locked })} title="Lock">
              {layer.locked ? <LockIcon /> : <UnlockIcon />}
            </Mini>
            <Mini onClick={() => store.patchLayer(layer.id, { hidden: !layer.hidden })} title="Hide">
              {layer.hidden ? <EyeOffIcon /> : <EyeIcon />}
            </Mini>
          </div>
        )
      })}
    </div>
  )
}

function Mini({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
    >
      {children}
    </button>
  )
}
