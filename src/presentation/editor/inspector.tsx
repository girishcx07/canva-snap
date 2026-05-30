'use client'

// Property inspector. Edits the selected layer (arrange / style / type fields /
// animations) or, when nothing is selected, the slide and project settings.

import { PlusIcon, XIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import {
  ANIMATION_CATEGORIES,
  createAnimationInstance,
  getPreset,
  presetsByCategory,
} from '../engine/animation'
import { findLayer } from '../doc'
import { getComponent } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'
import type { Layer, SlideTransitionType } from '../types'

export function Inspector({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const selected = useEditorStore(store, (s) => s.selectedLayerIds)
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]
  const layer = selected[0] ? findLayer(slide.layers, selected[0]) : undefined

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto bg-background p-3 pt-9 text-sm">
      {layer ? (
        <LayerInspector store={store} layer={layer} />
      ) : (
        <SlideInspector store={store} />
      )}
    </div>
  )
}

function LayerInspector({ store, layer }: { store: EditorStore; layer: Layer }) {
  const def = getComponent(layer.type)
  const setData = (key: string, value: unknown) =>
    store.patchLayer(layer.id, { data: { ...layer.data, [key]: value } })
  const setStyle = (key: string, value: unknown) =>
    store.patchLayer(layer.id, { style: { ...layer.style, [key]: value } })

  return (
    <>
      <Section title={`${def?.label ?? layer.type} · ${layer.name}`}>
        <Row>
          <Num label="X" value={layer.transform.x} onChange={(v) => store.patchTransform(layer.id, { x: v })} />
          <Num label="Y" value={layer.transform.y} onChange={(v) => store.patchTransform(layer.id, { y: v })} />
        </Row>
        <Row>
          <Num label="W" value={layer.transform.width} onChange={(v) => store.patchTransform(layer.id, { width: v })} />
          <Num label="H" value={layer.transform.height} onChange={(v) => store.patchTransform(layer.id, { height: v })} />
        </Row>
        <Row>
          <Num label="Rotate" value={layer.transform.rotation} onChange={(v) => store.patchTransform(layer.id, { rotation: v })} />
          <Num label="Opacity" step={0.1} value={layer.transform.opacity} onChange={(v) => store.patchTransform(layer.id, { opacity: v })} />
        </Row>
      </Section>

      {(def?.fields?.length || hasStyle(layer)) && (
        <Section title="Content & style">
          {def?.fields?.map((field) => {
            const value = String(layer.data[field.key] ?? '')
            if (field.type === 'textarea')
              return (
                <Field key={field.key} label={field.label}>
                  <textarea
                    className="min-h-20 w-full resize-y rounded-md border bg-transparent p-2 text-xs"
                    value={value}
                    onChange={(e) => setData(field.key, e.target.value)}
                  />
                </Field>
              )
            if (field.type === 'select')
              return (
                <Field key={field.key} label={field.label}>
                  <NativeSelect
                    value={value}
                    options={field.options ?? []}
                    onChange={(v) => setData(field.key, v)}
                  />
                </Field>
              )
            return (
              <Field key={field.key} label={field.label}>
                <Input
                  className="h-7"
                  value={value}
                  onChange={(e) => setData(field.key, e.target.value)}
                />
              </Field>
            )
          })}

          {'fill' in layer.style && (
            <Color label="Fill" value={layer.style.fill} onChange={(v) => setStyle('fill', v)} />
          )}
          {'color' in layer.style && (
            <Color label="Color" value={layer.style.color} onChange={(v) => setStyle('color', v)} />
          )}
          {'fontSize' in layer.style && (
            <Num label="Font size" value={layer.style.fontSize ?? 16} onChange={(v) => setStyle('fontSize', v)} />
          )}
          {'borderRadius' in layer.style && (
            <Num label="Radius" value={layer.style.borderRadius ?? 0} onChange={(v) => setStyle('borderRadius', v)} />
          )}
        </Section>
      )}

      <Section title="Morph key">
        <Input
          className="h-7"
          placeholder="shared-element id"
          value={layer.morphKey ?? ''}
          onChange={(e) => store.patchLayer(layer.id, { morphKey: e.target.value || undefined })}
        />
      </Section>

      <AnimationsSection store={store} layer={layer} />
    </>
  )
}

function AnimationsSection({ store, layer }: { store: EditorStore; layer: Layer }) {
  const add = (presetId: string) =>
    store.patchLayer(layer.id, {
      animations: [...layer.animations, createAnimationInstance(presetId)],
    })
  const remove = (id: string) =>
    store.patchLayer(layer.id, {
      animations: layer.animations.filter((a) => a.id !== id),
    })

  return (
    <Section title="Animations">
      <div className="flex flex-col gap-1">
        {layer.animations.map((anim) => (
          <div key={anim.id} className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-xs">
            <span>{getPreset(anim.presetId)?.name ?? anim.presetId}</span>
            <button onClick={() => remove(anim.id)} className="text-muted-foreground hover:text-foreground">
              <XIcon className="size-3" />
            </button>
          </div>
        ))}
      </div>
      {ANIMATION_CATEGORIES.map((category) => (
        <div key={category} className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground capitalize">{category}</span>
          <div className="flex flex-wrap gap-1">
            {presetsByCategory(category).map((preset) => (
              <button
                key={preset.id}
                onClick={() => add(preset.id)}
                className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] hover:bg-muted"
              >
                <PlusIcon className="size-3" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </Section>
  )
}

function SlideInspector({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)
  const currentSlideId = useEditorStore(store, (s) => s.currentSlideId)
  const slide =
    project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]

  return (
    <>
      <Section title="Slide">
        <Color
          label="Background"
          value={slide.background}
          onChange={(v) => store.patchSlide(slide.id, { background: v })}
        />
        <Field label="Transition">
          <NativeSelect
            value={slide.transition.type}
            options={[
              { label: 'None', value: 'none' },
              { label: 'Fade', value: 'fade' },
              { label: 'Slide', value: 'slide' },
              { label: 'Morph', value: 'morph' },
            ]}
            onChange={(v) =>
              store.patchSlide(slide.id, {
                transition: { ...slide.transition, type: v as SlideTransitionType },
              })
            }
          />
        </Field>
        <Num
          label="Duration (ms)"
          value={slide.transition.durationMs}
          onChange={(v) =>
            store.patchSlide(slide.id, {
              transition: { ...slide.transition, durationMs: v },
            })
          }
        />
        <Field label="Notes">
          <textarea
            className="min-h-16 w-full resize-y rounded-md border bg-transparent p-2 text-xs"
            value={slide.notes}
            onChange={(e) => store.patchSlide(slide.id, { notes: e.target.value })}
          />
        </Field>
      </Section>

      <Separator />

      <Section title="Project">
        <Field label="Name">
          <Input
            className="h-7"
            value={project.name}
            onChange={(e) => store.patchProject({ name: e.target.value })}
          />
        </Field>
        <Row>
          <Num label="Width" value={project.width} onChange={(v) => store.patchProject({ width: v })} />
          <Num label="Height" value={project.height} onChange={(v) => store.patchProject({ height: v })} />
        </Row>
      </Section>
    </>
  )
}

// --- Small field primitives -------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="truncate text-xs font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Num({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        step={step}
        className="h-7"
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  )
}

function Color({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="size-7 rounded border"
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          className="h-7 flex-1"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  )
}

function NativeSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      className="h-7 w-full rounded-md border bg-transparent px-2 text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function hasStyle(layer: Layer): boolean {
  return Object.keys(layer.style).length > 0
}

function toHex(value?: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}
