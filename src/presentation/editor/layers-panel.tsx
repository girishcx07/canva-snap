'use client'

// Unified Layers, Animations, and Playback Interactions Dashboard.
// Consolidates the standard Layers Tree, Slide Animations sequence/timeline order,
// and Advanced Trigger-Action event bindings into one cohesive sidebar panel.
// Designed with a premium focused UX: when an element is selected, it hides the slide
// list overview and gives 100% vertical screen space to animation & interaction parameters.

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
  Link2Icon,
  Link2OffIcon,
  MousePointerClickIcon,
  HandIcon,
  ClockIcon,
  KeyboardIcon,
  ZapIcon,
  ActivityIcon,
  CornerDownRightIcon,
} from 'lucide-react'
import { useState, useRef, useMemo } from 'react'

import { cn } from '@/lib/utils'

import { getComponent } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'
import { getPreset, createAnimationInstance, ANIMATION_PRESETS, frameToCss, sampleKeyframes } from '../engine/animation'
import { findLayer, uid } from '../doc'
import type { TriggerType, ActionType, EventBinding, EventAction, ID, EasingName } from '../types'

export function LayersPanel({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const selected = useEditorStore(store, (s) => s.selectedLayerIds)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'layers' | 'animations' | 'interactions'>('layers')

  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]
  const slideIndex = project.slides.findIndex((s) => s.id === slide.id)
  const selectedLayerId = selected[0]
  const layer = selectedLayerId ? findLayer(slide.layers, selectedLayerId) : undefined

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

  // Animation status helper
  const linkStatus = useMemo(() => {
    if (!layer || slideIndex === 0) return { isLinked: false }
    const prevSlide = project.slides[slideIndex - 1]
    const prevLayer = prevSlide.layers.find((l) => {
      const currentKey = layer.morphKey ?? `${layer.type}:${layer.name}`
      const prevKey = l.morphKey ?? `${l.type}:${l.name}`
      return currentKey === prevKey
    })
    return {
      isLinked: !!prevLayer,
      prevLayerId: prevLayer?.id,
    }
  }, [layer, slideIndex, project.slides])

  const handleReorderAnim = (layerId: string, direction: 'up' | 'down') => {
    const currentOrder = sortedByAnim.map((l) => l.id)
    const idx = currentOrder.indexOf(layerId)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return
    ;(store as any).reorderAnimation(layerId, targetIdx)
  }

  // Animation mutations
  function applyAnimation(presetId: string) {
    if (!layer) return
    const newAnim = createAnimationInstance(presetId)
    store.patchLayer(layer.id, {
      animations: [newAnim],
    })
  }

  function patchAnimationField(field: string, value: unknown) {
    if (!layer || layer.animations.length === 0) return
    const updated = layer.animations.map((a, idx) => {
      if (idx === 0) {
        return { ...a, [field]: value }
      }
      return a
    })
    store.patchLayer(layer.id, { animations: updated })
  }

  const currentAnim = layer?.animations?.[0]

  // Playback Interactions Mutations
  function updateEvents(events: EventBinding[]) {
    if (!layer) return
    store.patchLayer(layer.id, { events })
  }

  function addEvent(triggerType: TriggerType) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const newBinding: EventBinding = {
      id: uid('evt'),
      trigger: triggerType,
      triggerParams: triggerType === 'timer' ? { delay: 1000 } : triggerType === 'keyboard' ? { key: 'Enter' } : {},
      actions: [],
    }
    updateEvents([...currentEvents, newBinding])
  }

  function deleteEvent(bindingId: ID) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    updateEvents(currentEvents.filter((b) => b.id !== bindingId))
  }

  function patchEventTrigger(bindingId: ID, triggerType: TriggerType) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        return {
          ...b,
          trigger: triggerType,
          triggerParams: triggerType === 'timer' ? { delay: 1000 } : triggerType === 'keyboard' ? { key: 'Enter' } : {},
        }
      }
      return b
    })
    updateEvents(updated)
  }

  function patchEventParams(bindingId: ID, params: Record<string, unknown>) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        return { ...b, triggerParams: { ...b.triggerParams, ...params } }
      }
      return b
    })
    updateEvents(updated)
  }

  function addAction(bindingId: ID, actionType: ActionType) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const newAction: EventAction = {
          type: actionType,
          params: actionType === 'animate-layer' ? {
            layerId: 'self',
            presetId: 'fade-in',
            durationMs: 500,
            delayMs: 0,
            easing: 'easeOut',
          } : actionType === 'show-layer' || actionType === 'hide-layer' ? {
            layerId: 'self',
          } : {
            target: 'next',
          },
        }
        return { ...b, actions: [...b.actions, newAction] }
      }
      return b
    })
    updateEvents(updated)
  }

  function deleteAction(bindingId: ID, actionIndex: number) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const actions = [...b.actions]
        actions.splice(actionIndex, 1)
        return { ...b, actions }
      }
      return b
    })
    updateEvents(updated)
  }

  function patchAction(bindingId: ID, actionIndex: number, patchParams: Record<string, unknown>) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const actions = b.actions.map((act, idx) => {
          if (idx === actionIndex) {
            return { ...act, params: { ...act.params, ...patchParams } }
          }
          return act
        })
        return { ...b, actions }
      }
      return b
    })
    updateEvents(updated)
  }

  function changeActionType(bindingId: ID, actionIndex: number, newType: ActionType) {
    if (!layer) return
    const currentEvents = layer.events ?? []
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const actions = b.actions.map((act, idx) => {
          if (idx === actionIndex) {
            return {
              type: newType,
              params: newType === 'animate-layer' ? {
                layerId: 'self',
                presetId: 'fade-in',
                durationMs: 500,
                delayMs: 0,
                easing: 'easeOut',
              } : newType === 'show-layer' || newType === 'hide-layer' ? {
                layerId: 'self',
              } : {
                target: 'next',
              },
            }
          }
          return act
        })
        return { ...b, actions }
      }
      return b
    })
    updateEvents(updated)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden pr-1 text-foreground">
      {/* Sleek Premium 3-Tab Bar */}
      <div className="flex border-b border-muted/50 mb-3 text-[10px] bg-muted/40 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('layers')}
          className={cn(
            'flex-1 py-1.5 text-center font-bold rounded-md transition-all',
            activeTab === 'layers'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Layers Tree
        </button>
        <button
          onClick={() => setActiveTab('animations')}
          className={cn(
            'flex-1 py-1.5 text-center font-bold rounded-md transition-all flex items-center justify-center gap-1',
            activeTab === 'animations'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <SparklesIcon className="size-3 text-primary animate-pulse" />
          Animations
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={cn(
            'flex-1 py-1.5 text-center font-bold rounded-md transition-all flex items-center justify-center gap-1',
            activeTab === 'interactions'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ZapIcon className="size-3 text-yellow-500 animate-pulse" />
          Interactions
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'layers' && (
          /* TAB 1: Layers tree */
          <div className="flex flex-col gap-1">
            {orderedLayers.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No layers yet. Add one from Elements.
              </p>
            )}
            {orderedLayers.map((layerItem) => {
              const def = getComponent(layerItem.type)
              const index = slide.layers.findIndex((l) => l.id === layerItem.id)
              const last = slide.layers.length - 1
              return (
                <div
                  key={layerItem.id}
                  onClick={() => store.select([layerItem.id])}
                  className={cn(
                    'group/layer flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition',
                    selected.includes(layerItem.id) ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  {def && <def.icon className="size-3.5 shrink-0 text-muted-foreground" />}
                  {renaming === layerItem.id ? (
                    <input
                      autoFocus
                      defaultValue={layerItem.name}
                      className="flex-1 rounded bg-background px-1 text-sm outline-none ring-1 ring-primary"
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        store.patchLayer(layerItem.id, { name: e.target.value || layerItem.name })
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
                        setRenaming(layerItem.id)
                      }}
                    >
                      {layerItem.name}
                    </span>
                  )}
                  {layerItem.animations?.length > 0 && (
                    <SparklesIcon
                      className="size-3 shrink-0 text-primary animate-pulse"
                      aria-label="Has animation"
                    />
                  )}
                  <div className="hidden items-center gap-0.5 group-hover/layer:flex">
                    <Mini onClick={() => store.reorderLayer(layerItem.id, last)} title="Bring to front">
                      <ChevronsUpIcon />
                    </Mini>
                    <Mini onClick={() => store.reorderLayer(layerItem.id, index + 1)} title="Forward">
                      <ChevronUpIcon />
                    </Mini>
                    <Mini onClick={() => store.reorderLayer(layerItem.id, index - 1)} title="Backward">
                      <ChevronDownIcon />
                    </Mini>
                    <Mini onClick={() => store.reorderLayer(layerItem.id, 0)} title="Send to back">
                      <ChevronsDownIcon />
                    </Mini>
                    <Mini onClick={() => store.duplicateLayer(layerItem.id)} title="Duplicate">
                      <CopyIcon />
                    </Mini>
                    <Mini onClick={() => store.deleteLayer(layerItem.id)} title="Delete">
                      <Trash2Icon />
                    </Mini>
                  </div>
                  <Mini onClick={() => store.patchLayer(layerItem.id, { locked: !layerItem.locked })} title="Lock">
                    {layerItem.locked ? <LockIcon /> : <UnlockIcon />}
                  </Mini>
                  <Mini onClick={() => store.patchLayer(layerItem.id, { hidden: !layerItem.hidden })} title="Hide">
                    {layerItem.hidden ? <EyeOffIcon /> : <EyeIcon />}
                  </Mini>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'animations' && (
          /* TAB 2: Slide animation sequence OR properties panel based on layer selection */
          <div className="flex flex-col gap-4">
            {layer ? (
              /* FOCUSED UX: Show ONLY the configurator for the selected element, saving all screen space */
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <button
                  onClick={() => store.select([])}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition pb-2 border-b border-muted cursor-pointer"
                >
                  ← Back to slide sequence order
                </button>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1">
                    <SparklesIcon className="size-3.5 text-primary" /> Animation: {layer.name}
                  </span>
                </div>

                {/* Morph linking status */}
                {linkStatus.isLinked ? (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold text-green-600 dark:text-green-400">
                      <Link2Icon className="size-3.5" />
                      <span>Linked to Previous Slide</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      This element exists on the previous slide and will morph seamlessly.
                    </p>
                    <button
                      onClick={() => {
                        const unlinkedKey = `morph_unlinked_${uid('morph')}`
                        store.patchLayer(layer.id, { morphKey: unlinkedKey })
                      }}
                      className="flex items-center justify-center gap-1 rounded border border-red-200/50 bg-background py-1 text-[9px] font-bold text-red-600 shadow-xs hover:bg-red-50"
                    >
                      <Link2OffIcon className="size-3" />
                      <span>Unlink from other Slides</span>
                    </button>
                  </div>
                ) : (
                  slideIndex > 0 && (
                    <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-2 text-[10px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground/85">Not linked cross-slide</span>
                        <span className="text-muted-foreground">Enters/exits on this slide.</span>
                      </div>
                      <button
                        onClick={() => {
                          const prevSlide = project.slides[slideIndex - 1]
                          const candidate = prevSlide.layers.find((pl) => pl.type === layer.type)
                          if (candidate) {
                            const sharedKey = candidate.morphKey ?? `morph_${uid('morph')}`
                            if (!candidate.morphKey) {
                              store.patchLayer(candidate.id, { morphKey: sharedKey })
                            }
                            store.patchLayer(layer.id, { morphKey: sharedKey })
                          } else {
                            const sharedKey = `morph_${uid('morph')}`
                            store.patchLayer(layer.id, { morphKey: sharedKey })
                          }
                        }}
                        className="flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[9px] shadow-xs hover:bg-muted cursor-pointer"
                      >
                        <Link2Icon className="size-2.5" />
                        <span>Auto Link</span>
                      </button>
                    </div>
                  )
                )}

                {/* Featured Grids */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-foreground/80 flex items-center gap-1">
                    <SparklesIcon className="size-3 text-primary" /> Canva Featured Animations
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['simple', 'sleek', 'fun', 'party', 'corporate', 'chill'].map((pid) => {
                      const p = getPreset(pid)
                      if (!p) return null
                      return (
                        <PresetCard
                          key={p.id}
                          presetId={p.id}
                          label={p.name}
                          active={currentAnim?.presetId === p.id}
                          onClick={() => applyAnimation(p.id)}
                          onHover={() => store.previewAnimation(layer.id, p.id)}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* General Preset Lists */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-foreground/80 flex items-center gap-1">
                    <ActivityIcon className="size-3 text-primary" /> General Animations
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(layer.type === 'arrow'
                      ? ['draw', 'fade', 'rise', 'pan', 'pop', 'wipe', 'drift', 'tectonic', 'baseline', 'stomp', 'scrapbook', 'neon', 'bounce-in']
                      : ['fade', 'rise', 'pan', 'pop', 'wipe', 'drift', 'tectonic', 'baseline', 'stomp', 'scrapbook', 'neon', 'bounce-in']
                    ).map((pid) => {
                      const p = getPreset(pid)
                      if (!p) return null
                      return (
                        <PresetCard
                          key={p.id}
                          presetId={p.id}
                          label={p.name}
                          active={currentAnim?.presetId === p.id}
                          onClick={() => applyAnimation(p.id)}
                          onHover={() => store.previewAnimation(layer.id, p.id)}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Animation Parameters (Sliders & Easing) */}
                {currentAnim && (
                  <div className="flex flex-col gap-3 border-t border-muted/50 pt-3 mt-1.5 animate-in fade-in duration-200">
                    {/* Trigger selection dropdown */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-muted-foreground font-medium">Animate On (Trigger)</span>
                      <select
                        value={currentAnim.trigger}
                        onChange={(e) => patchAnimationField('trigger', e.target.value)}
                        className="w-full rounded border bg-background px-2 py-1 text-xs cursor-pointer text-foreground/80 focus:outline-none"
                      >
                        <option value="slide-enter">On Enter</option>
                        <option value="slide-exit">On Exit</option>
                        <option value="click">On Click</option>
                        <option value="with-previous">With Previous</option>
                        <option value="after-previous">After Previous</option>
                      </select>
                    </div>

                    {/* Direction selection (for Draw arrows) */}
                    {currentAnim.presetId === 'draw' && (
                      <div className="flex flex-col gap-1 text-[10px]">
                        <span className="text-muted-foreground font-medium">Draw Direction</span>
                        <div className="flex bg-muted p-0.5 rounded-lg border">
                          <button
                            onClick={() => patchAnimationField('direction', 'forward')}
                            className={`flex-1 py-0.5 text-center rounded text-[10px] font-semibold transition ${
                              (currentAnim.direction ?? 'forward') === 'forward'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Forward
                          </button>
                          <button
                            onClick={() => patchAnimationField('direction', 'backward')}
                            className={`flex-1 py-0.5 text-center rounded text-[10px] font-semibold transition ${
                              currentAnim.direction === 'backward'
                                ? 'bg-background text-foreground shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Backward
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Speed Slider */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Speed (Duration)</span>
                        <span className="text-foreground">{currentAnim.durationMs}ms</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={3000}
                        step={50}
                        value={currentAnim.durationMs}
                        onChange={(e) => patchAnimationField('durationMs', parseInt(e.target.value, 10))}
                        className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-1"
                      />
                    </div>

                    {/* Delay Slider */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Delay</span>
                        <span className="text-foreground">{currentAnim.delayMs}ms</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={2000}
                        step={50}
                        value={currentAnim.delayMs}
                        onChange={(e) => patchAnimationField('delayMs', parseInt(e.target.value, 10))}
                        className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-1"
                      />
                    </div>

                    {/* Easing Transition Select */}
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-muted-foreground font-medium">Easing Transition</span>
                      <select
                        className="rounded border bg-background px-2 py-1 text-xs cursor-pointer text-foreground/80 focus:outline-none"
                        value={currentAnim.easing}
                        onChange={(e) => patchAnimationField('easing', e.target.value as EasingName)}
                      >
                        <option value="linear">Linear</option>
                        <option value="easeIn">Ease In</option>
                        <option value="easeOut">Ease Out</option>
                        <option value="easeInOut">Ease In Out</option>
                        <option value="spring">Spring</option>
                        <option value="bounce">Bounce</option>
                      </select>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => store.patchLayer(layer.id, { animations: [] })}
                      className="w-full py-2 mt-2 text-[10px] font-bold text-center border border-red-200/50 bg-background hover:bg-red-50 text-red-600 rounded-lg transition cursor-pointer"
                    >
                      Remove all element animations
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* OVERVIEW UX: Show ONLY the sequence order overview list when no specific element is targeted */
              <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Timeline Sequence Order
                </span>
                {sortedByAnim.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-xl">
                    No elements on this slide yet.
                  </p>
                )}
                {sortedByAnim.map((layerItem, idx) => {
                  const def = getComponent(layerItem.type)
                  const layerAnim = layerItem.animations?.[0]
                  const hasAnim = !!layerAnim
                  const presetName = hasAnim
                    ? getPreset(layerAnim.presetId)?.name ?? layerAnim.presetId
                    : 'No animation'

                  return (
                    <div
                      key={layerItem.id}
                      onClick={() => store.select([layerItem.id])}
                      className={cn(
                        'flex flex-col gap-1.5 rounded-xl border p-2.5 transition cursor-pointer',
                        selected.includes(layerItem.id)
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-muted bg-card hover:bg-muted/10',
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {def && <def.icon className="size-3.5 shrink-0 text-muted-foreground" />}
                          <span className="truncate text-xs font-bold text-foreground/80">
                            {layerItem.name}
                          </span>
                        </div>

                        {/* Sequence reorder buttons */}
                        <div className="flex items-center gap-0.5">
                          <Mini
                            onClick={() => handleReorderAnim(layerItem.id, 'up')}
                            disabled={idx === 0}
                            title="Move Up in sequence"
                          >
                            <ArrowUpIcon className="size-3" />
                          </Mini>
                          <Mini
                            onClick={() => handleReorderAnim(layerItem.id, 'down')}
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
                            'font-semibold px-1.5 py-0.5 rounded text-[9px]',
                            hasAnim ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {presetName}
                        </span>

                        {hasAnim ? (
                          <select
                            value={layerAnim.trigger}
                            onChange={(e) => {
                              const updated = layerItem.animations.map((a, aIdx) =>
                                aIdx === 0 ? { ...a, trigger: e.target.value as import('../types').AnimationTrigger } : a,
                              )
                              store.patchLayer(layerItem.id, { animations: updated })
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
                              store.patchLayer(layerItem.id, { animations: [newAnim] })
                            }}
                            className="flex items-center gap-0.5 rounded-md border border-dashed border-primary/40 px-1.5 py-0.5 text-[9px] font-semibold text-primary hover:bg-primary/5 transition-all shadow-sm cursor-pointer"
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
        )}

        {activeTab === 'interactions' && (
          /* TAB 3: Advanced Trigger-Action event configurator OR slide interactions map overview */
          <div className="flex flex-col gap-4">
            {layer ? (
              /* FOCUSED UX: Show ONLY the configurator for the selected element, saving all screen space */
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <button
                  onClick={() => store.select([])}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 transition pb-2 border-b border-muted cursor-pointer"
                >
                  ← Back to interactions map
                </button>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1">
                    <ZapIcon className="size-3.5 text-primary" /> Advanced Trigger-Action Config
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Build custom interactions for <strong className="text-foreground/80">{layer.name}</strong>.
                </p>

                {(layer.events ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6 border border-dashed rounded-xl leading-relaxed bg-muted/5">
                    No custom bindings mapped yet. Add click, hover, timer, or keyboard triggers below!
                  </p>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {(layer.events ?? []).map((binding) => {
                      const triggerIcon =
                        ({
                          click: <MousePointerClickIcon className="size-3.5 text-blue-500" />,
                          hover: <HandIcon className="size-3.5 text-yellow-500" />,
                          'slide-enter': <EyeIcon className="size-3.5 text-green-500" />,
                          'slide-exit': <EyeOffIcon className="size-3.5 text-red-500" />,
                          timer: <ClockIcon className="size-3.5 text-purple-500" />,
                          keyboard: <KeyboardIcon className="size-3.5 text-orange-500" />,
                        } as Record<string, React.ReactNode>)[binding.trigger] || <ZapIcon className="size-3.5" />

                      return (
                        <div
                          key={binding.id}
                          className="bg-muted/10 border rounded-xl p-3 flex flex-col gap-2.5 relative shadow-xs"
                        >
                          {/* Trigger Header */}
                          <div className="flex items-center justify-between gap-1.5 border-b pb-1.5">
                            <div className="flex items-center gap-1">
                              {triggerIcon}
                              <select
                                value={binding.trigger}
                                onChange={(e) => patchEventTrigger(binding.id, e.target.value as TriggerType)}
                                className="text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 text-foreground/85 cursor-pointer focus:outline-none"
                              >
                                <option value="click">On Click</option>
                                <option value="hover">On Hover</option>
                                <option value="slide-enter">On Slide Enter</option>
                                <option value="slide-exit">On Slide Exit</option>
                                <option value="timer">After Delay (Timer)</option>
                                <option value="keyboard">On Key Press</option>
                              </select>
                            </div>
                            <button
                              onClick={() => deleteEvent(binding.id)}
                              className="text-muted-foreground hover:text-red-500 transition rounded cursor-pointer"
                            >
                              <Trash2Icon className="size-3.5" />
                            </button>
                          </div>

                          {/* Trigger Parameters */}
                          {binding.trigger === 'timer' && (
                            <label className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-muted-foreground">Timer Delay (ms)</span>
                              <input
                                type="number"
                                step={100}
                                className="w-20 rounded border bg-background px-1.5 py-0.5 text-right text-[10px] focus:outline-none"
                                value={Number(binding.triggerParams?.delay ?? 1000)}
                                onChange={(e) => patchEventParams(binding.id, { delay: parseInt(e.target.value, 10) })}
                              />
                            </label>
                          )}
                          {binding.trigger === 'keyboard' && (
                            <label className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-muted-foreground">Key code</span>
                              <input
                                type="text"
                                className="w-24 rounded border bg-background px-1.5 py-0.5 text-[10px] text-right focus:outline-none"
                                value={String(binding.triggerParams?.key ?? 'Enter')}
                                onChange={(e) => patchEventParams(binding.id, { key: e.target.value })}
                              />
                            </label>
                          )}

                          {/* Mapped Trigger Actions list */}
                          <div className="flex flex-col gap-2 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                              Trigger Actions
                            </span>
                            <div className="flex flex-col gap-2 pl-1 border-l-2 border-muted/50">
                              {binding.actions.map((action, actIdx) => (
                                <div
                                  key={actIdx}
                                  className="flex flex-col gap-1.5 bg-muted/20 border border-muted/40 rounded-lg p-2 relative"
                                >
                                  <div className="flex items-center justify-between gap-2 border-b border-muted/30 pb-1">
                                    <select
                                      value={action.type}
                                      onChange={(e) => changeActionType(binding.id, actIdx, e.target.value as ActionType)}
                                      className="text-[9px] font-bold bg-transparent border-none p-0 cursor-pointer text-foreground/75 focus:outline-none"
                                    >
                                      <option value="animate-layer">Animate Element</option>
                                      <option value="show-layer">Show Element</option>
                                      <option value="hide-layer">Hide Element</option>
                                      <option value="navigate-slide">Go to Slide</option>
                                    </select>
                                    <button
                                      onClick={() => deleteAction(binding.id, actIdx)}
                                      className="text-muted-foreground hover:text-red-500 transition rounded cursor-pointer"
                                    >
                                      <Trash2Icon className="size-3" />
                                    </button>
                                  </div>

                                  {/* Action target configs */}
                                  {action.type === 'animate-layer' && (
                                    <div className="flex flex-col gap-1.5 text-[9px]">
                                      <label className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground font-medium">Target</span>
                                        <select
                                          className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer focus:outline-none"
                                          value={String(action.params.layerId || 'self')}
                                          onChange={(e) => patchAction(binding.id, actIdx, { layerId: e.target.value })}
                                        >
                                          <option value="self">Self (this element)</option>
                                          {slide.layers
                                            .filter((l) => l.id !== layer.id)
                                            .map((l) => (
                                              <option key={l.id} value={l.id}>
                                                {l.name}
                                              </option>
                                            ))}
                                        </select>
                                      </label>

                                      <label className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground font-medium">Preset</span>
                                        <select
                                          className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer focus:outline-none"
                                          value={String(action.params.presetId || 'fade-in')}
                                          onChange={(e) => patchAction(binding.id, actIdx, { presetId: e.target.value })}
                                        >
                                          {ANIMATION_PRESETS
                                            .filter((p) => p.category !== 'advanced')
                                            .map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                        </select>
                                      </label>

                                      <div className="grid grid-cols-2 gap-1.5">
                                        <label className="flex flex-col gap-0.5">
                                          <span className="text-muted-foreground font-medium">Speed (ms)</span>
                                          <input
                                            type="number"
                                            step={50}
                                            className="rounded border bg-background px-1.5 py-0.5 text-[10px] focus:outline-none"
                                            value={Number(action.params.durationMs ?? 500)}
                                            onChange={(e) =>
                                              patchAction(binding.id, actIdx, { durationMs: parseInt(e.target.value, 10) })
                                            }
                                          />
                                        </label>
                                        <label className="flex flex-col gap-0.5">
                                          <span className="text-muted-foreground font-medium">Delay (ms)</span>
                                          <input
                                            type="number"
                                            step={50}
                                            className="rounded border bg-background px-1.5 py-0.5 text-[10px] focus:outline-none"
                                            value={Number(action.params.delayMs ?? 0)}
                                            onChange={(e) =>
                                              patchAction(binding.id, actIdx, { delayMs: parseInt(e.target.value, 10) })
                                            }
                                          />
                                        </label>
                                      </div>

                                      <label className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground font-medium">Easing</span>
                                        <select
                                          className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer focus:outline-none"
                                          value={String(action.params.easing ?? 'easeOut')}
                                          onChange={(e) => patchAction(binding.id, actIdx, { easing: e.target.value })}
                                        >
                                          <option value="linear">Linear</option>
                                          <option value="easeIn">Ease In</option>
                                          <option value="easeOut">Ease Out</option>
                                          <option value="easeInOut">Ease In Out</option>
                                          <option value="spring">Spring</option>
                                          <option value="bounce">Bounce</option>
                                        </select>
                                      </label>
                                    </div>
                                  )}

                                  {(action.type === 'show-layer' || action.type === 'hide-layer') && (
                                    <label className="flex flex-col gap-0.5 text-[9px]">
                                      <span className="text-muted-foreground font-medium">Target</span>
                                      <select
                                        className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer focus:outline-none"
                                        value={String(action.params.layerId || 'self')}
                                        onChange={(e) => patchAction(binding.id, actIdx, { layerId: e.target.value })}
                                      >
                                        <option value="self">Self (this element)</option>
                                        {slide.layers
                                          .filter((l) => l.id !== layer.id)
                                          .map((l) => (
                                            <option key={l.id} value={l.id}>
                                              {l.name}
                                            </option>
                                          ))}
                                      </select>
                                    </label>
                                  )}

                                  {action.type === 'navigate-slide' && (
                                    <label className="flex flex-col gap-0.5 text-[9px]">
                                      <span className="text-muted-foreground font-medium">Target Slide</span>
                                      <select
                                        className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer focus:outline-none"
                                        value={String(action.params.target ?? 'next')}
                                        onChange={(e) => patchAction(binding.id, actIdx, { target: e.target.value })}
                                      >
                                        <option value="next">Next Slide</option>
                                        <option value="prev">Previous Slide</option>
                                        {project.slides.map((s, idx) => (
                                          <option key={s.id} value={idx}>
                                            Slide {idx + 1}: {s.name}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Add actions triggers */}
                          <div className="flex gap-1.5 mt-1">
                            <button
                              onClick={() => addAction(binding.id, 'animate-layer')}
                              className="flex-1 flex items-center justify-center gap-1 rounded border border-dashed border-primary/45 bg-primary/5 hover:bg-primary/10 py-1 text-[8px] font-bold text-primary transition cursor-pointer"
                            >
                              <PlusIcon className="size-2" />
                              <span>Add Animation</span>
                            </button>
                            <button
                              onClick={() => addAction(binding.id, 'show-layer')}
                              className="flex-1 flex items-center justify-center gap-1 rounded border border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 py-1 text-[8px] font-bold text-muted-foreground transition cursor-pointer"
                            >
                              <PlusIcon className="size-2" />
                              <span>Add Control</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add bindings buttons */}
                <div className="flex flex-col gap-2 border-t border-muted/50 pt-3 mt-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Add Interaction Trigger
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => addEvent('click')}
                      className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition cursor-pointer"
                    >
                      <MousePointerClickIcon className="size-3.5 text-blue-500" />
                      <span>On Click</span>
                    </button>
                    <button
                      onClick={() => addEvent('hover')}
                      className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition cursor-pointer"
                    >
                      <HandIcon className="size-3.5 text-yellow-500" />
                      <span>On Hover</span>
                    </button>
                    <button
                      onClick={() => addEvent('slide-enter')}
                      className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition cursor-pointer"
                    >
                      <EyeIcon className="size-3.5 text-green-500" />
                      <span>On Slide Enter</span>
                    </button>
                    <button
                      onClick={() => addEvent('timer')}
                      className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition cursor-pointer"
                    >
                      <ClockIcon className="size-3.5 text-purple-500" />
                      <span>After Delay</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* OVERVIEW UX: Show ONLY the Slide Interactions Map overview list when no specific element is targeted */
              <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Slide Interactions Map
                </span>
                {slide.layers.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-xl">
                    No elements on this slide yet.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {slide.layers.map((l) => {
                    const isSelected = selected.includes(l.id)
                    const hasEvents = l.events && l.events.length > 0

                    // Morph Linked status check
                    const isLinked =
                      slideIndex > 0 &&
                      !!project.slides[slideIndex - 1].layers.find((prevL) => {
                        const currentKey = l.morphKey ?? `${l.type}:${l.name}`
                        const prevKey = prevL.morphKey ?? `${prevL.type}:${prevL.name}`
                        return currentKey === prevKey
                      })

                    return (
                      <div
                        key={l.id}
                        onClick={() => store.select([l.id])}
                        className={cn(
                          'flex flex-col rounded-lg border transition p-2.5 cursor-pointer',
                          isSelected ? 'border-primary bg-primary/[0.03] shadow-xs' : 'bg-card hover:bg-muted/30',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-foreground truncate">{l.name}</span>
                          {isLinked ? (
                            <span className="text-[8px] bg-green-500/10 text-green-600 rounded px-1.5 py-0.5 font-bold flex items-center gap-0.5">
                              <Link2Icon className="size-2.5" /> Morph
                            </span>
                          ) : (
                            slideIndex > 0 && (
                              <span className="text-[8px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-bold">
                                Independent
                              </span>
                            )
                          )}
                        </div>

                        {hasEvents ? (
                          <div className="mt-2 flex flex-col gap-1.5 border-t border-muted/50 pt-2 text-[10px]">
                            {l.events.map((evt) => {
                              const iconMap: Record<string, React.ReactNode> = {
                                click: <MousePointerClickIcon className="size-2.5 text-blue-500" />,
                                hover: <HandIcon className="size-2.5 text-yellow-500" />,
                                'slide-enter': <EyeIcon className="size-2.5 text-green-500" />,
                                'slide-exit': <EyeOffIcon className="size-2.5 text-red-500" />,
                                timer: <ClockIcon className="size-2.5 text-purple-500" />,
                                keyboard: <KeyboardIcon className="size-2.5 text-orange-500" />,
                              }
                              const labelMap: Record<string, string> = {
                                click: 'On Click',
                                hover: 'On Hover',
                                'slide-enter': 'On Enter',
                                'slide-exit': 'On Exit',
                                timer: 'After Delay',
                                keyboard: 'On Key',
                              }

                              return (
                                <div key={evt.id} className="flex flex-col gap-1 rounded bg-muted/20 p-1.5">
                                  <div className="flex items-center gap-1 font-semibold text-foreground/80">
                                    {iconMap[evt.trigger] ?? <ZapIcon className="size-2.5" />}
                                    <span>{labelMap[evt.trigger] ?? evt.trigger}</span>
                                  </div>
                                  {evt.actions.length === 0 ? (
                                    <div className="pl-3.5 text-muted-foreground text-[9px] italic">No actions</div>
                                  ) : (
                                    <div className="flex flex-col gap-0.5 pl-3 border-l border-muted/65">
                                      {evt.actions.map((act, index) => {
                                        if (act.type === 'animate-layer') {
                                          const targetName =
                                            act.params.layerId === 'self' || !act.params.layerId
                                              ? 'Self'
                                              : slide.layers.find((la) => la.id === act.params.layerId)?.name ?? 'Element'
                                          return (
                                            <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                              <CornerDownRightIcon className="size-2" />
                                              <span>
                                                Animate <strong className="text-foreground/70">{targetName}</strong> with{' '}
                                                {getPreset(String(act.params.presetId))?.name ??
                                                  String(act.params.presetId ?? '')}
                                              </span>
                                            </div>
                                          )
                                        }
                                        if (act.type === 'show-layer' || act.type === 'hide-layer') {
                                          const targetName =
                                            act.params.layerId === 'self' || !act.params.layerId
                                              ? 'Self'
                                              : slide.layers.find((la) => la.id === act.params.layerId)?.name ?? 'Element'
                                          return (
                                            <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                              <CornerDownRightIcon className="size-2" />
                                              <span>
                                                {act.type === 'show-layer' ? 'Show' : 'Hide'}{' '}
                                                <strong className="text-foreground/70">{targetName}</strong>
                                              </span>
                                            </div>
                                          )
                                        }
                                        return (
                                          <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                            <CornerDownRightIcon className="size-2" />
                                            <span>Action: {act.type}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="mt-1 text-[9px] text-muted-foreground italic pl-1">No custom bindings mapped</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
        'grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted [&_svg]:size-3.5 transition',
        disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

// Preset tile with a Canva-style hover preview (plays the animation on a dot).
function PresetCard({
  presetId,
  label,
  active,
  onClick,
  onHover,
}: {
  presetId: string
  label: string
  active: boolean
  onClick: () => void
  onHover?: () => void
}) {
  const dot = useRef<HTMLSpanElement>(null)
  function preview() {
    onHover?.()
    const p = getPreset(presetId)
    if (!p || !dot.current) return
    const frames = [0, 0.25, 0.5, 0.75, 1].map((o) => {
      const css = frameToCss(sampleKeyframes(p.keyframes, o))
      return { offset: o, transform: css.transform, opacity: css.opacity }
    })
    dot.current.animate(frames, {
      duration: p.defaultDurationMs,
      easing: 'ease',
    })
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={preview}
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs hover:bg-muted cursor-pointer transition',
        active ? 'border-primary bg-primary/10 text-primary font-bold shadow-2xs' : 'border-muted bg-card',
      )}
    >
      <span className="grid h-6 w-full place-items-center overflow-hidden">
        <span ref={dot} className="size-3 rounded-sm bg-primary" />
      </span>
      {label}
    </button>
  )
}
