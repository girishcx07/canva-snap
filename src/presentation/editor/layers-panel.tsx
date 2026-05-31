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
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
} from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { getComponent } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'
import { getPreset, createAnimationInstance } from '../engine/animation'

export function LayersPanel({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const selected = useEditorStore(store, (s) => s.selectedLayerIds)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'layers' | 'animations'>('layers')

  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]

  // Top layer first (rendered last = visually on top).
  const orderedLayers = [...slide.layers].reverse()

  // Sorted by slide.animationOrder if exists
  const animOrder = slide.animationOrder ?? []
  const sortedByAnim = [...slide.layers].sort((a, b) => {
    const ia = animOrder.indexOf(a.id)
    const ib = animOrder.indexOf(b.id)
    if (ia < 0 && ib < 0) return 0
    if (ia < 0) return 1
    if (ib < 0) return -1
    return ia - ib
  })

  const handleReorderAnim = (layerId: string, direction: 'up' | 'down') => {
    const currentOrder = sortedByAnim.map((l) => l.id)
    const idx = currentOrder.indexOf(layerId)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return
    ;(store as any).reorderAnimation(layerId, targetIdx)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden pr-1 text-foreground">
      {/* Sleek Premium Tab Bar */}
      <div className="flex border-b border-muted/50 mb-3 text-[11px] bg-muted/40 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('layers')}
          className={cn(
            'flex-1 py-1.5 text-center font-semibold rounded-md transition-all',
            activeTab === 'layers'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Layers Tree
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={cn(
            'flex-1 py-1.5 text-center font-semibold rounded-md transition-all flex items-center justify-center gap-1',
            activeTab === 'animations'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <SparklesIcon className="size-3 text-primary animate-pulse" />
          Animations
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'layers' ? (
          /* TAB 1: Layers tree */
          <div className="flex flex-col gap-1">
            {orderedLayers.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No layers yet. Add one from Elements.
              </p>
            )}
            {orderedLayers.map((layer) => {
              const def = getComponent(layer.type)
              const index = slide.layers.findIndex((l) => l.id === layer.id)
              const last = slide.layers.length - 1
              return (
                <div
                  key={layer.id}
                  onClick={() => store.select([layer.id])}
                  className={cn(
                    'group/layer flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition',
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
                      className="flex-1 truncate font-medium text-foreground/80 cursor-pointer"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setRenaming(layer.id)
                      }}
                    >
                      {layer.name}
                    </span>
                  )}
                  {layer.animations?.length > 0 && (
                    <SparklesIcon
                      className="size-3 shrink-0 text-primary animate-pulse"
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
        ) : (
          /* TAB 2: Animation sequences */
          <div className="flex flex-col gap-2">
            {sortedByAnim.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No layers on this slide yet.
              </p>
            )}
            {sortedByAnim.map((layer, idx) => {
              const def = getComponent(layer.type)
              const layerAnim = layer.animations?.[0]
              const hasAnim = !!layerAnim
              const presetName = hasAnim
                ? getPreset(layerAnim.presetId)?.name ?? layerAnim.presetId
                : 'No animation'

              return (
                <div
                  key={layer.id}
                  onClick={() => store.select([layer.id])}
                  className={cn(
                    'flex flex-col gap-1.5 rounded-xl border p-2.5 transition cursor-pointer',
                    selected.includes(layer.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-muted bg-card hover:bg-muted/10',
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {def && <def.icon className="size-3.5 shrink-0 text-muted-foreground" />}
                      <span className="truncate text-xs font-bold text-foreground/80">
                        {layer.name}
                      </span>
                    </div>

                    {/* Sequence reorder buttons */}
                    <div className="flex items-center gap-0.5">
                      <Mini
                        onClick={() => handleReorderAnim(layer.id, 'up')}
                        disabled={idx === 0}
                        title="Move Up in sequence"
                      >
                        <ArrowUpIcon className="size-3" />
                      </Mini>
                      <Mini
                        onClick={() => handleReorderAnim(layer.id, 'down')}
                        disabled={idx === sortedByAnim.length - 1}
                        title="Move Down in sequence"
                      >
                        <ArrowDownIcon className="size-3" />
                      </Mini>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 mt-1 border-t border-muted/50 pt-1.5 text-[10px]">
                    <span
                      className={cn(
                        'font-semibold px-1.5 py-0.5 rounded-md text-[9px]',
                        hasAnim ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {presetName}
                    </span>

                    {hasAnim ? (
                      <select
                        value={layerAnim.trigger}
                        onChange={(e) => {
                          const updated = layer.animations.map((a, aIdx) =>
                            aIdx === 0 ? { ...a, trigger: e.target.value } : a,
                          )
                          store.patchLayer(layer.id, { animations: updated })
                        }}
                        className="rounded border border-input bg-background px-1 py-0.5 text-[9px] text-muted-foreground font-medium max-w-[100px] cursor-pointer focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="slide-enter">On Enter</option>
                        <option value="slide-exit">On Exit</option>
                        <option value="click">On Click</option>
                        <option value="with-previous">With Previous</option>
                        <option value="after-previous">After Previous</option>
                      </select>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newAnim = createAnimationInstance('fade')
                          store.patchLayer(layer.id, { animations: [newAnim] })
                        }}
                        className="flex items-center gap-0.5 rounded-md border border-dashed border-primary/40 px-1.5 py-0.5 text-[9px] font-semibold text-primary hover:bg-primary/5 transition-all shadow-sm"
                      >
                        <PlusIcon className="size-2.5" /> Animate
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Mini({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted [&_svg]:size-3.5 transition",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
      )}
    >
      {children}
    </button>
  )
}

