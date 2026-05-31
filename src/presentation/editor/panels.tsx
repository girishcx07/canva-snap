"use client";

// Secondary-panel contents for the Canva-style sidebar. Asset libraries are
// external and keyless: Iconify (icons) and Openverse (images). Results are
// cached per query; clicking inserts a centered layer on the current slide.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SearchIcon,
  Link2,
  Link2Off,
  Sparkles,
  Plus,
  Trash2,
  Play,
  MousePointerClick,
  Hand,
  Clock,
  Keyboard,
  Eye,
  EyeOff,
  CornerDownRight,
  Zap,
  Activity,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { SlideThumbnail } from "./slide-navigator";

import {
  createAnimationInstance,
  frameToCss,
  getPreset,
  sampleKeyframes,
  ANIMATION_PRESETS,
} from "../engine/animation";
import { createCenteredLayer } from "../registry";
import { useEditorStore, type EditorStore } from "../store";
import { findLayer, uid } from "../doc";
import type { TriggerType, ActionType, EventBinding, EventAction, ID, EasingName } from "../types";
import { TEMPLATES } from "../templates";
import {
  listSavedTemplates,
  saveTemplate,
  type SavedTemplate,
} from "../storage";

type PanelProps = { store: EditorStore };

type DropPayload = {
  type: string;
  data?: Record<string, unknown>;
  iconify?: string;
};

function dragProps(payload: DropPayload) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) =>
      e.dataTransfer.setData(
        "application/x-deck-element",
        JSON.stringify(payload),
      ),
  };
}

function insert(
  store: EditorStore,
  type: string,
  patch?: Parameters<typeof createCenteredLayer>[2],
) {
  const layer = createCenteredLayer(type, store.getState().project, patch);
  if (layer) store.addLayer(layer);
}

function AddButton({
  label,
  onClick,
  payload,
}: {
  label: string;
  onClick: () => void;
  payload?: DropPayload;
}) {
  return (
    <button
      onClick={onClick}
      {...(payload ? dragProps(payload) : {})}
      className="cursor-grab rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted active:cursor-grabbing"
    >
      {label}
    </button>
  );
}

export function TextPanel({ store }: PanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <AddButton
        label="Add a heading"
        payload={{ type: "heading", data: { text: "Heading" } }}
        onClick={() => insert(store, "heading", { data: { text: "Heading" } })}
      />
      <AddButton
        label="Add a subheading"
        payload={{ type: "heading", data: { text: "Subheading" } }}
        onClick={() =>
          insert(store, "heading", {
            data: { text: "Subheading" },
            style: { fontSize: 32, fontWeight: 600 },
          })
        }
      />
      <AddButton
        label="Add body text"
        payload={{ type: "text", data: { text: "Body text" } }}
        onClick={() => insert(store, "text", { data: { text: "Body text" } })}
      />
    </div>
  );
}

export function CodePanel({ store }: PanelProps) {
  const items: { type: string; label: string; preview: React.ReactNode }[] = [
    {
      type: "code",
      label: "Code",
      preview: (
        <div className="flex flex-col gap-1 p-2">
          <span className="h-1 w-3/4 rounded bg-sky-400/70" />
          <span className="h-1 w-1/2 rounded bg-foreground/30" />
          <span className="h-1 w-2/3 rounded bg-foreground/30" />
        </div>
      ),
    },
    {
      type: "browser",
      label: "Browser",
      preview: (
        <div className="flex flex-col">
          <div className="flex items-center gap-0.5 border-b bg-muted px-1.5 py-1">
            <span className="size-1.5 rounded-full bg-[#ff5f57]" />
            <span className="size-1.5 rounded-full bg-[#febc2e]" />
            <span className="size-1.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="h-7 bg-background" />
        </div>
      ),
    },
    {
      type: "file-tree",
      label: "File tree",
      preview: (
        <div className="flex flex-col gap-1 p-2 text-[8px]">
          <span className="h-1 w-2/3 rounded bg-sky-400/70" />
          <span className="ml-2 h-1 w-1/2 rounded bg-foreground/30" />
          <span className="ml-2 h-1 w-1/2 rounded bg-foreground/30" />
        </div>
      ),
    },
    {
      type: "sandbox",
      label: "Sandbox",
      preview: (
        <div className="flex flex-col">
          <div className="h-2 bg-muted" />
          <div className="grid h-9 place-items-center bg-white text-[8px] text-slate-500">
            preview
          </div>
        </div>
      ),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <button
          key={it.type}
          {...dragProps({ type: it.type })}
          onClick={() => insert(store, it.type)}
          className="flex cursor-grab flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary active:cursor-grabbing"
        >
          <div className="h-12 overflow-hidden rounded border bg-muted/30">
            {it.preview}
          </div>
          <span className="px-0.5 text-xs font-medium">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ShapesPanel({ store }: PanelProps) {
  const shapes = [
    { label: "Rectangle", shape: "rect" },
    { label: "Rounded", shape: "rounded" },
    { label: "Circle", shape: "circle" },
    { label: "Pill", shape: "pill" },
    { label: "Triangle", shape: "triangle" },
    { label: "Diamond", shape: "diamond" },
    { label: "Star", shape: "star" },
    { label: "Line", shape: "line" },
  ];
  const preview: Record<string, React.CSSProperties> = {
    rect: { borderRadius: 2 },
    rounded: { borderRadius: 10 },
    circle: { borderRadius: "50%" },
    pill: { borderRadius: 9999, height: 20 },
    triangle: { clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" },
    diamond: { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
    star: {
      clipPath:
        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    },
    line: { height: 4, borderRadius: 9999 },
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {shapes.map((s) => (
        <button
          key={s.shape}
          title={s.label}
          {...dragProps({ type: "shape", data: { shape: s.shape } })}
          onClick={() => insert(store, "shape", { data: { shape: s.shape } })}
          className="flex aspect-square cursor-grab items-center justify-center rounded-lg border hover:bg-muted active:cursor-grabbing"
        >
          <span className="size-8 bg-foreground/70" style={preview[s.shape]} />
        </button>
      ))}
    </div>
  );
}

export function AnimationsPanel({ store }: PanelProps) {
  const project = useEditorStore(store, (s) => s.project);
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId);
  const selected = useEditorStore(store, (s) => s.selectedLayerIds);
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0];
  const slideIndex = project.slides.findIndex((s) => s.id === slide.id);
  const layer = selected[0] ? findLayer(slide.layers, selected[0]) : undefined;

  // Check link status to previous slide
  const linkStatus = useMemo(() => {
    if (!layer || slideIndex === 0) return { isLinked: false };
    const prevSlide = project.slides[slideIndex - 1];

    const prevLayer = prevSlide.layers.find((l) => {
      const currentKey = layer.morphKey ?? `${layer.type}:${layer.name}`;
      const prevKey = l.morphKey ?? `${l.type}:${l.name}`;
      return currentKey === prevKey;
    });

    return {
      isLinked: !!prevLayer,
      prevLayerId: prevLayer?.id,
    };
  }, [layer, slideIndex, project.slides, layer?.morphKey, layer?.name]);

  function applyAnimation(presetId: string) {
    if (!layer) return;
    const newAnim = createAnimationInstance(presetId);
    store.patchLayer(layer.id, {
      animations: [newAnim],
    });
  }

  function patchAnimationField(field: string, value: unknown) {
    if (!layer || layer.animations.length === 0) return;
    const updated = layer.animations.map((a, idx) => {
      if (idx === 0) {
        return { ...a, [field]: value };
      }
      return a;
    });
    store.patchLayer(layer.id, { animations: updated });
  }

  const currentAnim = layer?.animations?.[0];

  return (
    <div className="flex flex-col gap-5">
      {layer ? (
        <div className="flex flex-col gap-4">
          <div className="h-px bg-border" />

          {/* Slide Linking Banner */}
          {linkStatus.isLinked ? (
            <div className="flex flex-col gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-green-600 dark:text-green-400">
                <Link2 className="size-3.5 animate-pulse" />
                <span>Linked to Previous Slide</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This element exists on the previous slide and will morph seamlessly.
              </p>
              <button
                onClick={() => {
                  const unlinkedKey = `morph_unlinked_${uid("morph")}`;
                  store.patchLayer(layer.id, { morphKey: unlinkedKey });
                }}
                className="flex items-center justify-center gap-1 rounded border border-red-200/50 bg-background py-1 text-[10px] font-semibold text-red-600 shadow-xs hover:bg-red-50"
              >
                <Link2Off className="size-3" />
                <span>Unlink from other Slides</span>
              </button>
            </div>
          ) : (
            slideIndex > 0 && (
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-2.5 text-[10px]">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground/80">Not linked cross-slide</span>
                  <span className="text-muted-foreground">Enters/exits on this slide.</span>
                </div>
                <button
                  onClick={() => {
                    const prevSlide = project.slides[slideIndex - 1];
                    const candidate = prevSlide.layers.find(pl => pl.type === layer.type);
                    if (candidate) {
                      const sharedKey = candidate.morphKey ?? `morph_${uid('morph')}`;
                      if (!candidate.morphKey) {
                        store.patchLayer(candidate.id, { morphKey: sharedKey });
                      }
                      store.patchLayer(layer.id, { morphKey: sharedKey });
                    } else {
                      const sharedKey = `morph_${uid('morph')}`;
                      store.patchLayer(layer.id, { morphKey: sharedKey });
                    }
                  }}
                  className="flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[9px] shadow-xs hover:bg-muted"
                >
                  <Link2 className="size-2.5" />
                  <span>Auto Link</span>
                </button>
              </div>
            )
          )}

          {/* Canva Featured Grids */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-foreground/80 flex items-center gap-1">
              <Sparkles className="size-3.5 text-primary" /> Canva Featured Animations
            </span>
            <div className="grid grid-cols-3 gap-2">
              {['simple', 'sleek', 'fun', 'party', 'corporate', 'chill'].map((pid) => {
                const p = getPreset(pid);
                if (!p) return null;
                return (
                  <PresetCard
                    key={p.id}
                    presetId={p.id}
                    label={p.name}
                    active={currentAnim?.presetId === p.id}
                    onClick={() => applyAnimation(p.id)}
                    onHover={() => store.previewAnimation(layer.id, p.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Canva General Grids */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-foreground/80 flex items-center gap-1">
              <Activity className="size-3.5 text-primary" /> General Animations
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(layer?.type === 'arrow'
                ? ['draw', 'fade', 'rise', 'pan', 'pop', 'wipe', 'drift', 'tectonic', 'baseline', 'stomp', 'scrapbook', 'neon', 'bounce-in']
                : ['fade', 'rise', 'pan', 'pop', 'wipe', 'drift', 'tectonic', 'baseline', 'stomp', 'scrapbook', 'neon', 'bounce-in']
              ).map((pid) => {
                const p = getPreset(pid);
                if (!p) return null;
                return (
                  <PresetCard
                    key={p.id}
                    presetId={p.id}
                    label={p.name}
                    active={currentAnim?.presetId === p.id}
                    onClick={() => applyAnimation(p.id)}
                    onHover={() => store.previewAnimation(layer.id, p.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Custom Animation Properties Panel */}
          {currentAnim && (
            <div className="flex flex-col gap-3.5 border-t border-muted pt-3.5 mt-2 animate-in fade-in duration-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Animation Parameters
              </span>

              {/* Trigger Dropdown */}
              <div className="flex flex-col gap-1 text-[10px]">
                <span className="text-muted-foreground font-medium">Animate On (Trigger)</span>
                <select
                  value={currentAnim.trigger}
                  onChange={(e) => patchAnimationField('trigger', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                >
                  <option value="slide-enter">On Enter (Slide Start)</option>
                  <option value="slide-exit">On Exit (Slide End)</option>
                  <option value="click">On Click (Step Trigger)</option>
                  <option value="with-previous">With Previous (Simultaneous)</option>
                  <option value="after-previous">After Previous (Sequential)</option>
                </select>
              </div>

              {/* Direction Toggle (Only for Draw Preset) */}
              {currentAnim.presetId === 'draw' && (
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="text-muted-foreground font-medium">Draw Direction</span>
                  <div className="flex bg-muted p-0.5 rounded-lg border">
                    <button
                      onClick={() => patchAnimationField('direction', 'forward')}
                      className={`flex-1 py-1 text-center rounded-md font-semibold transition ${
                        (currentAnim.direction ?? 'forward') === 'forward'
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Forward
                    </button>
                    <button
                      onClick={() => patchAnimationField('direction', 'backward')}
                      className={`flex-1 py-1 text-center rounded-md font-semibold transition ${
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
                  className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-1.5"
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
                  className="w-full accent-primary bg-muted rounded-lg appearance-none cursor-pointer h-1.5"
                />
              </div>

              {/* Easing Selector */}
              <label className="flex flex-col gap-1 text-[10px]">
                <span className="text-muted-foreground font-medium">Easing Transition</span>
                <select
                  className="rounded border bg-background px-2 py-1 text-xs cursor-pointer text-foreground/80"
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
              </label>

              {/* Remove All Animations */}
              <button
                onClick={() => store.patchLayer(layer.id, { animations: [] })}
                className="w-full py-2 mt-2 text-[10px] font-bold text-center border border-red-200/50 bg-background hover:bg-red-50 text-red-600 rounded-lg transition"
              >
                Remove all element animations
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="px-1 text-xs text-muted-foreground leading-relaxed italic text-center py-8">
          Select any element to add Canva-style animations and link them across slides.
        </p>
      )}
    </div>
  );
}

export function PlaybackPanel({ store }: PanelProps) {
  const project = useEditorStore(store, (s) => s.project);
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId);
  const selected = useEditorStore(store, (s) => s.selectedLayerIds);
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0];
  const slideIndex = project.slides.findIndex((s) => s.id === slide.id);
  const layer = selected[0] ? findLayer(slide.layers, selected[0]) : undefined;

  const [activeTab, setActiveTab] = useState<'configure' | 'map'>('configure');

  // Trigger-Action Mutations
  function updateEvents(events: EventBinding[]) {
    if (!layer) return;
    store.patchLayer(layer.id, { events });
  }

  function addEvent(triggerType: TriggerType) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    const newBinding: EventBinding = {
      id: uid("evt"),
      trigger: triggerType,
      triggerParams: triggerType === 'timer' ? { delay: 1000 } : triggerType === 'keyboard' ? { key: 'Enter' } : {},
      actions: [],
    };
    updateEvents([...currentEvents, newBinding]);
  }

  function deleteEvent(bindingId: ID) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    updateEvents(currentEvents.filter((b) => b.id !== bindingId));
  }

  function patchEventTrigger(bindingId: ID, triggerType: TriggerType) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        return {
          ...b,
          trigger: triggerType,
          triggerParams: triggerType === 'timer' ? { delay: 1000 } : triggerType === 'keyboard' ? { key: 'Enter' } : {},
        };
      }
      return b;
    });
    updateEvents(updated);
  }

  function patchEventParams(bindingId: ID, params: Record<string, unknown>) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        return { ...b, triggerParams: { ...b.triggerParams, ...params } };
      }
      return b;
    });
    updateEvents(updated);
  }

  function addAction(bindingId: ID, actionType: ActionType) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
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
        };
        return { ...b, actions: [...b.actions, newAction] };
      }
      return b;
    });
    updateEvents(updated);
  }

  function deleteAction(bindingId: ID, actionIndex: number) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const actions = [...b.actions];
        actions.splice(actionIndex, 1);
        return { ...b, actions };
      }
      return b;
    });
    updateEvents(updated);
  }

  function patchAction(bindingId: ID, actionIndex: number, patchParams: Record<string, unknown>) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
    const updated = currentEvents.map((b) => {
      if (b.id === bindingId) {
        const actions = b.actions.map((act, idx) => {
          if (idx === actionIndex) {
            return { ...act, params: { ...act.params, ...patchParams } };
          }
          return act;
        });
        return { ...b, actions };
      }
      return b;
    });
    updateEvents(updated);
  }

  function changeActionType(bindingId: ID, actionIndex: number, newType: ActionType) {
    if (!layer) return;
    const currentEvents = layer.events ?? [];
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
            };
          }
          return act;
        });
        return { ...b, actions };
      }
      return b;
    });
    updateEvents(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tabs Controller */}
      <div className="flex bg-muted/80 p-0.5 rounded-lg border border-muted/50 text-[10px]">
        <button
          onClick={() => setActiveTab('configure')}
          className={`flex-1 py-1 text-center font-bold rounded transition ${
            activeTab === 'configure'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Configure Selected
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-1 text-center font-bold rounded transition ${
            activeTab === 'map'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Slide Interactions Map
        </button>
      </div>

      {activeTab === 'configure' ? (
        /* TAB 1: Advanced Trigger-Action Configurator */
        <div className="flex flex-col gap-4">
          {layer ? (
            <div className="flex flex-col gap-3 mt-1.5">
              <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1">
                <Zap className="size-3.5 text-primary animate-pulse" /> Advanced Element Interactions
              </span>

              {(layer.events ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-6 border border-dashed rounded-xl leading-relaxed">
                  No advanced triggers mapped yet. Choose an event type below to build clicks, hovers or timing animation triggers!
                </p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {(layer.events ?? []).map((binding) => {
                    const triggerIcon = ({
                      click: <MousePointerClick className="size-3.5 text-blue-500" />,
                      hover: <Hand className="size-3.5 text-yellow-500" />,
                      'slide-enter': <Eye className="size-3.5 text-green-500" />,
                      'slide-exit': <EyeOff className="size-3.5 text-red-500" />,
                      timer: <Clock className="size-3.5 text-purple-500" />,
                      keyboard: <Keyboard className="size-3.5 text-orange-500" />,
                    } as Record<string, React.ReactNode>)[binding.trigger] || <Zap className="size-3.5" />;

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
                              className="text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 text-foreground/80 cursor-pointer"
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
                            className="text-muted-foreground hover:text-red-500 transition rounded"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* Parameters */}
                        {binding.trigger === 'timer' && (
                          <label className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-muted-foreground">Timer Delay (ms)</span>
                            <input
                              type="number"
                              step={100}
                              className="w-20 rounded border bg-background px-1.5 py-0.5 text-right text-[10px]"
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
                              className="w-24 rounded border bg-background px-1.5 py-0.5 text-[10px] text-right"
                              value={String(binding.triggerParams?.key ?? 'Enter')}
                              onChange={(e) => patchEventParams(binding.id, { key: e.target.value })}
                            />
                          </label>
                        )}

                        {/* Actions list */}
                        <div className="flex flex-col gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                            Trigger Actions
                          </span>
                          <div className="flex flex-col gap-2 pl-1 border-l-2 border-muted/50">
                            {binding.actions.map((action, actIdx) => (
                              <div key={actIdx} className="flex flex-col gap-1.5 bg-muted/20 border border-muted/40 rounded-lg p-2 relative">
                                <div className="flex items-center justify-between gap-2 border-b border-muted/30 pb-1">
                                  <select
                                    value={action.type}
                                    onChange={(e) => changeActionType(binding.id, actIdx, e.target.value as ActionType)}
                                    className="text-[9px] font-bold bg-transparent border-none p-0 cursor-pointer text-foreground/70"
                                  >
                                    <option value="animate-layer">Animate Element</option>
                                    <option value="show-layer">Show Element</option>
                                    <option value="hide-layer">Hide Element</option>
                                    <option value="navigate-slide">Go to Slide</option>
                                  </select>
                                  <button
                                    onClick={() => deleteAction(binding.id, actIdx)}
                                    className="text-muted-foreground hover:text-red-500 transition rounded"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>

                                {action.type === 'animate-layer' && (
                                  <div className="flex flex-col gap-1.5 text-[9px]">
                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground font-medium">Target</span>
                                      <select
                                        className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer"
                                        value={String(action.params.layerId || 'self')}
                                        onChange={(e) => patchAction(binding.id, actIdx, { layerId: e.target.value })}
                                      >
                                        <option value="self">Self (this element)</option>
                                        {slide.layers
                                          .filter(l => l.id !== layer.id)
                                          .map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                          ))}
                                      </select>
                                    </label>

                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground font-medium">Preset</span>
                                      <select
                                        className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer"
                                        value={String(action.params.presetId || 'fade-in')}
                                        onChange={(e) => patchAction(binding.id, actIdx, { presetId: e.target.value })}
                                      >
                                        {ANIMATION_PRESETS
                                          .filter(p => p.category !== 'advanced')
                                          .map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                      </select>
                                    </label>

                                    <div className="grid grid-cols-2 gap-1.5">
                                      <label className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground font-medium">Duration (ms)</span>
                                        <input
                                          type="number"
                                          step={50}
                                          className="rounded border bg-background px-1 py-0.5 text-[10px]"
                                          value={Number(action.params.durationMs ?? 500)}
                                          onChange={(e) => patchAction(binding.id, actIdx, { durationMs: parseInt(e.target.value, 10) })}
                                        />
                                      </label>
                                      <label className="flex flex-col gap-0.5">
                                        <span className="text-muted-foreground font-medium">Delay (ms)</span>
                                        <input
                                          type="number"
                                          step={50}
                                          className="rounded border bg-background px-1 py-0.5 text-[10px]"
                                          value={Number(action.params.delayMs ?? 0)}
                                          onChange={(e) => patchAction(binding.id, actIdx, { delayMs: parseInt(e.target.value, 10) })}
                                        />
                                      </label>
                                    </div>

                                    <label className="flex flex-col gap-0.5">
                                      <span className="text-muted-foreground font-medium">Easing Style</span>
                                      <select
                                        className="rounded border bg-background px-1.5 py-0.5 text-[10px] cursor-pointer text-foreground/80"
                                        value={String(action.params.easing || 'easeOut')}
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

                                    <button
                                      onClick={() => {
                                        const targetId = action.params.layerId === 'self' || !action.params.layerId ? layer.id : String(action.params.layerId);
                                        store.previewAnimation(targetId, String(action.params.presetId || 'fade-in'));
                                      }}
                                      className="flex items-center justify-center gap-1 rounded border bg-background hover:bg-muted py-1 text-[9px] font-bold text-primary shadow-xs transition"
                                    >
                                      <Play className="size-2.5 fill-current" />
                                      <span>Test Action Animation</span>
                                    </button>
                                  </div>
                                )}

                                {(action.type === 'show-layer' || action.type === 'hide-layer') && (
                                  <label className="flex flex-col gap-0.5 text-[9px]">
                                    <span className="text-muted-foreground font-medium">Target Element</span>
                                    <select
                                      className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer"
                                      value={String(action.params.layerId || 'self')}
                                      onChange={(e) => patchAction(binding.id, actIdx, { layerId: e.target.value })}
                                    >
                                      <option value="self">Self (this element)</option>
                                      {slide.layers
                                        .filter(l => l.id !== layer.id)
                                        .map(l => (
                                          <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                  </label>
                                )}

                                {action.type === 'navigate-slide' && (
                                  <label className="flex flex-col gap-0.5 text-[9px]">
                                    <span className="text-muted-foreground font-medium">Target Slide</span>
                                    <select
                                      className="rounded border bg-background px-1.5 py-0.5 text-[10px] text-foreground/80 cursor-pointer"
                                      value={String(action.params.target ?? 'next')}
                                      onChange={(e) => patchAction(binding.id, actIdx, { target: e.target.value })}
                                    >
                                      <option value="next">Next Slide</option>
                                      <option value="prev">Previous Slide</option>
                                      {project.slides.map((s, idx) => (
                                        <option key={s.id} value={idx}>Slide {idx + 1}: {s.name}</option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                              </div>
                            ))}
                          </div>

                        <div className="flex gap-1.5 mt-1">
                          <button
                            onClick={() => addAction(binding.id, 'animate-layer')}
                            className="flex-1 flex items-center justify-center gap-1 rounded border border-dashed border-primary/45 bg-primary/5 hover:bg-primary/10 py-1 text-[8px] font-bold text-primary transition"
                          >
                            <Plus className="size-2" />
                            <span>Add Animation</span>
                          </button>
                          <button
                            onClick={() => addAction(binding.id, 'show-layer')}
                            className="flex-1 flex items-center justify-center gap-1 rounded border border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 py-1 text-[8px] font-bold text-muted-foreground transition"
                          >
                            <Plus className="size-2" />
                            <span>Add Control</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}

              {/* Trigger Injector Panel */}
              <div className="flex flex-col gap-2 border-t border-muted/50 pt-3 mt-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Add Interaction Trigger
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => addEvent('click')}
                    className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition"
                  >
                    <MousePointerClick className="size-3.5 text-blue-500" />
                    <span>On Click</span>
                  </button>
                  <button
                    onClick={() => addEvent('hover')}
                    className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition"
                  >
                    <Hand className="size-3.5 text-yellow-500" />
                    <span>On Hover</span>
                  </button>
                  <button
                    onClick={() => addEvent('slide-enter')}
                    className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition"
                  >
                    <Eye className="size-3.5 text-green-500" />
                    <span>On Slide Enter</span>
                  </button>
                  <button
                    onClick={() => addEvent('timer')}
                    className="flex items-center gap-1.5 justify-start rounded-lg border bg-background px-2 py-1.5 text-[10px] font-semibold hover:bg-muted transition"
                  >
                    <Clock className="size-3.5 text-purple-500" />
                    <span>After Delay</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="px-1 text-xs text-muted-foreground leading-relaxed italic text-center py-8">
              Select any slide element to configure custom event triggers and dynamic animations/actions!
            </p>
          )}
        </div>
      ) : (
        /* TAB 2: Slide-wide Interactions Map */
        <div className="flex flex-col gap-3 mt-1.5">
          {slide.layers.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground leading-relaxed italic text-center py-6">
              No elements on this slide yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {slide.layers.map((l) => {
                const isSelected = selected.includes(l.id);
                const hasEvents = l.events && l.events.length > 0;
                
                // Check link status to previous slide
                const isLinked = slideIndex > 0 && !!project.slides[slideIndex - 1].layers.find(prevL => {
                  const currentKey = l.morphKey ?? `${l.type}:${l.name}`;
                  const prevKey = prevL.morphKey ?? `${prevL.type}:${prevL.name}`;
                  return currentKey === prevKey;
                });

                return (
                  <div
                    key={l.id}
                    onClick={() => store.select([l.id])}
                    className={
                      "flex flex-col rounded-lg border transition p-2.5 cursor-pointer " +
                      (isSelected ? "border-primary bg-primary/[0.03] shadow-sm" : "bg-card hover:bg-muted/30")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">{l.name}</span>
                      {isLinked ? (
                        <span className="text-[9px] bg-green-500/10 text-green-600 rounded px-1.5 py-0.5 font-medium flex items-center gap-1">
                          <Link2 className="size-2.5" /> Morph Linked
                        </span>
                      ) : (
                        slideIndex > 0 && (
                          <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                            Independent
                          </span>
                        )
                      )}
                    </div>

                    {hasEvents ? (
                      <div className="mt-2 flex flex-col gap-1.5 border-t border-muted/50 pt-2 text-[10px]">
                        {l.events.map((evt) => {
                          const iconMap: Record<string, React.ReactNode> = {
                            click: <MousePointerClick className="size-2.5 text-blue-500" />,
                            hover: <Hand className="size-2.5 text-yellow-500" />,
                            'slide-enter': <Eye className="size-2.5 text-green-500" />,
                            'slide-exit': <EyeOff className="size-2.5 text-red-500" />,
                            timer: <Clock className="size-2.5 text-purple-500" />,
                            keyboard: <Keyboard className="size-2.5 text-orange-500" />,
                          };
                          const labelMap: Record<string, string> = {
                            click: 'On Click',
                            hover: 'On Hover',
                            'slide-enter': 'On Enter',
                            'slide-exit': 'On Exit',
                            timer: 'After Delay',
                            keyboard: 'On Key',
                          };

                          return (
                            <div key={evt.id} className="flex flex-col gap-1 rounded bg-muted/20 p-1.5">
                              <div className="flex items-center gap-1.5 font-semibold text-foreground/80">
                                {iconMap[evt.trigger] ?? <Zap className="size-2.5" />}
                                <span>{labelMap[evt.trigger] ?? evt.trigger}</span>
                              </div>
                              {evt.actions.length === 0 ? (
                                <div className="pl-3.5 text-muted-foreground text-[9px] italic">No actions</div>
                              ) : (
                                <div className="flex flex-col gap-0.5 pl-3.5 border-l border-muted/65">
                                  {evt.actions.map((act, index) => {
                                    if (act.type === 'animate-layer') {
                                      const targetName = act.params.layerId === 'self' || !act.params.layerId
                                        ? 'Self'
                                        : slide.layers.find(la => la.id === act.params.layerId)?.name ?? 'Element';
                                      return (
                                        <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                          <CornerDownRight className="size-2" />
                                          <span>Animate <strong className="text-foreground/70">{targetName}</strong> with {getPreset(String(act.params.presetId))?.name ?? String(act.params.presetId ?? '')}</span>
                                        </div>
                                      );
                                    }
                                    if (act.type === 'show-layer' || act.type === 'hide-layer') {
                                      const targetName = act.params.layerId === 'self' || !act.params.layerId
                                        ? 'Self'
                                        : slide.layers.find(la => la.id === act.params.layerId)?.name ?? 'Element';
                                      return (
                                        <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                          <CornerDownRight className="size-2" />
                                          <span>{act.type === 'show-layer' ? 'Show' : 'Hide'} <strong className="text-foreground/70">{targetName}</strong></span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={index} className="text-muted-foreground text-[9px] flex items-center gap-1">
                                        <CornerDownRight className="size-2" />
                                        <span>Action: {act.type}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-1 text-[9px] text-muted-foreground italic pl-1">No event bindings defined yet</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Preset tile with a Canva-style hover preview (plays the animation on a dot).
function PresetCard({
  presetId,
  label,
  active,
  onClick,
  onHover,
}: {
  presetId: string;
  label: string;
  active: boolean;
  onClick: () => void;
  onHover?: () => void;
}) {
  const dot = useRef<HTMLSpanElement>(null);
  function preview() {
    onHover?.();
    const p = getPreset(presetId);
    if (!p || !dot.current) return;
    const frames = [0, 0.25, 0.5, 0.75, 1].map((o) => {
      const css = frameToCss(sampleKeyframes(p.keyframes, o));
      return { offset: o, transform: css.transform, opacity: css.opacity };
    });
    dot.current.animate(frames, {
      duration: p.defaultDurationMs,
      easing: "ease",
    });
  }
  return (
    <button
      onClick={onClick}
      onMouseEnter={preview}
      className={
        "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs hover:bg-muted " +
        (active ? "border-primary bg-primary/10 text-primary" : "")
      }
    >
      <span className="grid h-6 w-full place-items-center overflow-hidden">
        <span ref={dot} className="size-3 rounded-sm bg-primary" />
      </span>
      {label}
    </button>
  );
}

export function TemplatesPanel({ store }: PanelProps) {
  const previews = useMemo(
    () => TEMPLATES.map((t) => ({ t, project: t.build() })),
    [],
  );
  const [saved, setSaved] = useState<SavedTemplate[]>([]);
  useEffect(() => setSaved(listSavedTemplates()), []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Applying a template replaces the current deck.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {previews.map(({ t, project }) => (
          <button
            key={t.id}
            onClick={() => store.replaceProject(t.build())}
            className="flex flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary"
          >
            <div className="overflow-hidden rounded border bg-muted/30">
              <SlideThumbnail
                project={project}
                slide={project.slides[0]}
                width={140}
              />
            </div>
            <span className="px-0.5 text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
          Your templates
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => {
          const p = store.getState().project;
          setSaved(saveTemplate(p.name || "Template", structuredClone(p)));
        }}
        className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
      >
        + Save current deck as template
      </button>

      {saved.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">
          No saved templates yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {saved.map((s) => (
            <button
              key={s.id}
              onClick={() => store.replaceProject(structuredClone(s.project))}
              className="flex flex-col gap-1 rounded-lg border p-1.5 text-left hover:border-primary"
            >
              <div className="overflow-hidden rounded border bg-muted/30">
                <SlideThumbnail
                  project={s.project}
                  slide={s.project.slides[0]}
                  width={140}
                />
              </div>
              <span className="truncate px-0.5 text-xs font-medium">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Iconify (icons) -------------------------------------------------------

const iconCache = new Map<string, string[]>();

export function IconsPanel({ store }: PanelProps) {
  const [q, setQ] = useState("arrow");
  const [icons, setIcons] = useState<string[]>([]);

  useEffect(() => {
    const query = q.trim();
    if (!query) return setIcons([]);
    if (iconCache.has(query)) return setIcons(iconCache.get(query)!);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=72`,
        );
        const j = (await r.json()) as { icons?: string[] };
        iconCache.set(query, j.icons ?? []);
        setIcons(j.icons ?? []);
      } catch {
        setIcons([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  async function add(name: string) {
    try {
      const svg = await (
        await fetch(`https://api.iconify.design/${name.replace(":", "/")}.svg`)
      ).text();
      insert(store, "svg", {
        data: { markup: svg },
        transform: { width: 120, height: 120 },
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search icons" />
      {icons.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          Type to search thousands of open-source icons.
        </p>
      )}
      <div className="grid grid-cols-5 gap-1 overflow-auto">
        {icons.map((name) => (
          <button
            key={name}
            title={name}
            {...dragProps({ type: "svg", iconify: name, data: {} })}
            onClick={() => add(name)}
            className="grid aspect-square cursor-grab place-items-center rounded-md border bg-muted/40 p-1.5 hover:bg-muted active:cursor-grabbing"
          >
            <img
              src={`https://api.iconify.design/${name.replace(":", "/")}.svg`}
              alt=""
              loading="lazy"
              className="size-full dark:invert"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Openverse (images) ----------------------------------------------------

type OpenverseImage = {
  id: string;
  url: string;
  thumbnail?: string;
  title?: string;
};
const imageCache = new Map<string, OpenverseImage[]>();

const FALLBACK_IMAGES: OpenverseImage[] = [
  { id: 'fb1', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80', title: 'Developer Workspace' },
  { id: 'fb2', url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=400&q=80', title: 'Multi-Monitor Desk' },
  { id: 'fb3', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80', title: 'Software Engineering' },
  { id: 'fb4', url: 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=400&q=80', title: 'Creative Palette' },
  { id: 'fb5', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&q=80', title: 'Vibrant Paint Gradient' },
  { id: 'fb6', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80', title: 'Sunlit Office' },
  { id: 'fb7', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80', title: 'Retro Gamer Desk' },
  { id: 'fb8', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80', title: 'Minimal Workspace' },
  { id: 'fb9', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80', title: 'Product UI Design' },
  { id: 'fb10', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', title: '3D Abstract Shapes' },
  { id: 'fb11', url: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=400&q=80', title: 'Dark Mode Programming' },
  { id: 'fb12', url: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=400&q=80', title: 'UI Design System' },
  { id: 'fb13', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80', title: 'Premium Audio Gear' },
  { id: 'fb14', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&q=80', title: 'Mobile App Mockups' },
  { id: 'fb15', url: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=400&q=80', title: 'Brainstorm Whiteboard' },
  { id: 'fb16', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=400&q=80', title: 'Indigo Gradient' },
  { id: 'fb17', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80', title: 'Cyberpunk Game Room' },
  { id: 'fb18', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=400&q=80', title: 'Clean Development Terminal' },
  { id: 'fb19', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80', title: 'Creative Conference Desk' },
  { id: 'fb20', url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=400&q=80', title: 'UI Designing on Tablet' },
];

export function ImagesPanel({ store }: PanelProps) {
  const [q, setQ] = useState("");
  const [imgs, setImgs] = useState<OpenverseImage[]>([]);

  useEffect(() => {
    const query = q.trim() || "workspace";
    if (imageCache.has(query)) return setImgs(imageCache.get(query)!);
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`,
        );
        const j = (await r.json()) as { results?: OpenverseImage[] };
        const results = j.results && j.results.length > 0 ? j.results : FALLBACK_IMAGES;
        imageCache.set(query, results);
        setImgs(results);
      } catch {
        imageCache.set(query, FALLBACK_IMAGES);
        setImgs(FALLBACK_IMAGES);
      }
    }, q.trim() === "" ? 0 : 350);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search images" />
      {imgs.length === 0 && q.trim() !== "" && (
        <p className="px-1 text-xs text-muted-foreground">
          No images found. Search free images from Openverse.
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5 overflow-auto">
        {imgs.map((img) => (
          <button
            key={img.id}
            title={img.title}
            {...dragProps({
              type: "image",
              data: { src: img.url, alt: img.title ?? "" },
            })}
            onClick={() =>
              insert(store, "image", {
                data: { src: img.url, alt: img.title ?? "" },
                transform: { width: 360, height: 240 },
              })
            }
            className="cursor-grab overflow-hidden rounded-md border hover:opacity-90 active:cursor-grabbing"
          >
            <img
              src={img.thumbnail ?? img.url}
              alt=""
              loading="lazy"
              className="h-20 w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-8 pl-7"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
