'use client'

// Property inspector. Edits the selected layer (arrange / style / type fields /
// animations) or, when nothing is selected, the slide and project settings.

import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

import { findLayer } from '../doc'
import { getComponent } from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'
import type { Layer, SlideTransitionType } from '../types'

const FONTS = [
  { label: 'Sans', value: 'var(--font-sans)' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
  { label: 'System', value: 'system-ui, sans-serif' },
]

const CODE_FONTS = [
  { label: 'Default Mono', value: 'var(--font-mono, ui-monospace, monospace)' },
  { label: 'Fira Code', value: "'Fira Code', 'Fira Mono', monospace" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Inconsolata', value: "'Inconsolata', monospace" },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
]

const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #10b981, #0ea5e9)',
  'linear-gradient(135deg, #111827, #374151)',
  'linear-gradient(135deg, #fafafa, #e5e7eb)',
]

function parseBoxShadow(shadowStr: string) {
  const defaultShadow = { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.15)' }
  if (!shadowStr) return defaultShadow

  try {
    let color = 'rgba(0,0,0,0.15)'
    let numbersPart = shadowStr.trim()

    // Match rgba/rgb or hsla/hsl or hex color string
    const colorMatch = shadowStr.match(/(rgba?\(.*?\)|hsla?\(.*?\)|#[0-9a-fA-F]{3,8})/i)
    if (colorMatch) {
      color = colorMatch[0]
      numbersPart = shadowStr.replace(color, '').trim()
    }

    // Parse coordinates and sizes (split by whitespace, removing any px units)
    const parts = numbersPart
      .split(/\s+/)
      .map((p) => p.replace(/px/g, '').trim())
      .filter(Boolean)

    const x = parseFloat(parts[0] || '0')
    const y = parseFloat(parts[1] || '0')
    const blur = parseFloat(parts[2] || '0')
    const spread = parseFloat(parts[3] || '0')

    return {
      x: isNaN(x) ? 0 : x,
      y: isNaN(y) ? 0 : y,
      blur: isNaN(blur) ? 0 : blur,
      spread: isNaN(spread) ? 0 : spread,
      color,
    }
  } catch (e) {
    return defaultShadow
  }
}

function stringifyBoxShadow(x: number, y: number, blur: number, spread: number, color: string) {
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`
}

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
  const setData = (key: string, value: unknown) => {
    if (layer.type === 'code' && key === 'language') {
      const files = layer.data.files as import('../components/code-block').CodeFile[] | undefined
      if (files && files.length > 0) {
        const active = (layer.data.activeFile as number | undefined) ?? 0
        const updatedFiles = [...files]
        if (updatedFiles[active]) {
          updatedFiles[active] = { ...updatedFiles[active], language: value as string }
        }
        store.patchLayer(layer.id, { data: { ...layer.data, files: updatedFiles } })
        return
      }
    }
    store.patchLayer(layer.id, { data: { ...layer.data, [key]: value } })
  }
  const setStyle = (key: string, value: unknown) =>
    store.patchLayer(layer.id, { style: { ...layer.style, [key]: value } })

  return (
    <>
      <Section title={def?.label && def.label.toLowerCase() !== layer.name.toLowerCase() ? `${def.label} · ${layer.name}` : layer.name}>
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
          {'fontSize' in layer.style && (
            <Field label="Font">
              <NativeSelect
                value={String(layer.style.fontFamily ?? 'var(--font-sans)')}
                options={FONTS}
                onChange={(v) => setStyle('fontFamily', v)}
              />
            </Field>
          )}
          {'fontSize' in layer.style && (
            <Field label="Align">
              <NativeSelect
                value={layer.style.textAlign ?? 'left'}
                options={[
                  { label: 'Left', value: 'left' },
                  { label: 'Center', value: 'center' },
                  { label: 'Right', value: 'right' },
                ]}
                onChange={(v) => setStyle('textAlign', v)}
              />
            </Field>
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

      {layer.type === 'code' && (
        <>
          <Section title="Theme">
            <Field label="Theme">
              <NativeSelect
                value={String(layer.data.theme ?? 'github-dark')}
                options={[
                  { label: 'GitHub Dark', value: 'github-dark' },
                  { label: 'GitHub Light', value: 'github-light' },
                  { label: 'Dracula', value: 'dracula' },
                  { label: 'Nord', value: 'nord' },
                  { label: 'One Dark Pro', value: 'one-dark-pro' },
                  { label: 'Monokai', value: 'monokai' },
                  { label: 'Solarized Dark', value: 'solarized-dark' },
                  { label: 'Solarized Light', value: 'solarized-light' },
                ]}
                onChange={(v) => setData('theme', v)}
              />
            </Field>
          </Section>

          {/* ── Window Chrome ──────────────────────────────────────────── */}
          <Section title="Window chrome">
            <Row>
              <Field label="Show chrome">
                <Toggle
                  active={layer.data.showWindowChrome !== false}
                  onChange={(v) => setData('showWindowChrome', v)}
                  label={layer.data.showWindowChrome !== false ? 'Visible' : 'Hidden'}
                />
              </Field>
              <Field label="Show accent">
                <Toggle
                  active={layer.data.showAccentColor !== false}
                  onChange={(v) => setData('showAccentColor', v)}
                  label={layer.data.showAccentColor !== false ? 'On' : 'Off'}
                />
              </Field>
            </Row>
            {layer.data.showAccentColor !== false && (
              <Color
                label="Accent color"
                value={String(layer.data.accentColor ?? '#ff5f57')}
                onChange={(v) => setData('accentColor', v)}
              />
            )}
          </Section>

          {/* ── Border ─────────────────────────────────────────────────── */}
          <Section title="Border">
            <Row>
              <Num
                label="Width (px)"
                value={Number(layer.data.borderWidth ?? 0)}
                onChange={(v) => setData('borderWidth', v > 0 ? v : undefined)}
              />
              <Color
                label="Color"
                value={String(layer.data.borderColor ?? '#ffffff26')}
                onChange={(v) => setData('borderColor', v)}
              />
            </Row>
          </Section>

          {/* ── Typography ─────────────────────────────────────────────── */}
          <Section title="Typography">
            <Row>
              <Num
                label="Font size"
                value={Number(layer.data.fontSize ?? 16)}
                onChange={(v) => setData('fontSize', v)}
              />
              <Field label="Tab size">
                <NativeSelect
                  value={String(layer.data.tabSize ?? 2)}
                  options={[
                    { label: '2 spaces', value: '2' },
                    { label: '3 spaces', value: '3' },
                    { label: '4 spaces', value: '4' },
                    { label: '6 spaces', value: '6' },
                  ]}
                  onChange={(v) => setData('tabSize', Number(v))}
                />
              </Field>
            </Row>
            <Field label="Font family">
              <NativeSelect
                value={String(layer.data.fontFamily ?? 'var(--font-mono, ui-monospace, monospace)')}
                options={CODE_FONTS}
                onChange={(v) => setData('fontFamily', v)}
              />
            </Field>
            <Field label="Ligatures">
              <Toggle
                active={!!layer.data.ligatures}
                onChange={(v) => setData('ligatures', v)}
                label={layer.data.ligatures ? 'Enabled' : 'Disabled'}
              />
            </Field>
          </Section>

          {/* ── Line Numbers ───────────────────────────────────────────── */}
          <Section title="Line numbers">
            <Row>
              <Field label="Show numbers">
                <Toggle
                  active={layer.data.showLineNumbers !== false}
                  onChange={(v) => setData('showLineNumbers', v)}
                  label={layer.data.showLineNumbers !== false ? 'On' : 'Off'}
                />
              </Field>
              <Num
                label="Start from"
                value={Number(layer.data.lineNumberStart ?? 1)}
                onChange={(v) => setData('lineNumberStart', Math.max(1, v))}
              />
            </Row>
          </Section>

          {/* ── Code Highlighting ──────────────────────────────────────── */}
          <Section title="Code highlighting">
            <Field label="Focus lines — dim others (e.g. 3,4,5)">
              <Input
                className="h-7"
                value={lineList(layer.data.focusLines)}
                onChange={(e) => setData('focusLines', parseLineList(e.target.value))}
              />
            </Field>
            <Row>
              <Field label="Opacity">
                <NativeSelect
                  value={String(layer.data.highlightOpacity ?? 100)}
                  options={[
                    { label: '25%', value: '25' },
                    { label: '50%', value: '50' },
                    { label: '75%', value: '75' },
                    { label: '100%', value: '100' },
                  ]}
                  onChange={(v) => setData('highlightOpacity', Number(v))}
                />
              </Field>
              <Field label="Filter">
                <NativeSelect
                  value={String(layer.data.highlightFilter ?? 'none')}
                  options={[
                    { label: 'None', value: 'none' },
                    { label: 'Blur', value: 'blur' },
                    { label: 'Gray-out', value: 'grayout' },
                  ]}
                  onChange={(v) => setData('highlightFilter', v)}
                />
              </Field>
            </Row>
            <Field label="Highlight lines (e.g. 2,7)">
              <Input
                className="h-7"
                value={lineList(layer.data.highlightLines)}
                onChange={(e) => setData('highlightLines', parseLineList(e.target.value))}
              />
            </Field>
            <Row>
              <Field label="Added lines">
                <Input
                  className="h-7"
                  value={lineList(layer.data.diff && (layer.data.diff as { added?: number[] }).added)}
                  onChange={(e) =>
                    setData('diff', { ...(layer.data.diff as object), added: parseLineList(e.target.value) })
                  }
                />
              </Field>
              <Field label="Removed lines">
                <Input
                  className="h-7"
                  value={lineList(layer.data.diff && (layer.data.diff as { removed?: number[] }).removed)}
                  onChange={(e) =>
                    setData('diff', { ...(layer.data.diff as object), removed: parseLineList(e.target.value) })
                  }
                />
              </Field>
            </Row>
          </Section>

          {/* ── Presentation ───────────────────────────────────────────── */}
          <Section title="Presentation">
            <Field label="Reveal on enter">
              <NativeSelect
                value={String(layer.data.reveal ?? 'none')}
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Typing', value: 'typing' },
                  { label: 'Line by line', value: 'lines' },
                ]}
                onChange={(v) => setData('reveal', v)}
              />
            </Field>
            {(layer.data.reveal === 'typing') && (
              <Row>
                <Num
                  label="Speed (chars/s)"
                  value={Number(layer.data.revealSpeed ?? 40)}
                  onChange={(v) => setData('revealSpeed', Math.max(1, v))}
                />
                <Num
                  label="Delay (ms)"
                  value={Number(layer.data.revealDelay ?? 0)}
                  onChange={(v) => setData('revealDelay', Math.max(0, v))}
                />
              </Row>
            )}
            <Row>
              <Num
                label="Visible from"
                value={range(layer)[0]}
                onChange={(v) => setData('visibleRange', [Math.max(1, v), range(layer)[1]])}
              />
              <Num
                label="Visible to"
                value={range(layer)[1]}
                onChange={(v) => setData('visibleRange', [range(layer)[0], v])}
              />
            </Row>
          </Section>

          {/* ── Code Change Animation ──────────────────────────────────── */}
          <Section title="Code change animation">
            <p className="text-[10px] text-muted-foreground">
              Animates code changes between slides. Give matching code blocks the same Morph Key.
            </p>
            <Field label="Transition type">
              <NativeSelect
                value={String((layer.data.codeAnimation as any)?.type ?? 'none')}
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Fade In', value: 'fadeIn' },
                  { label: 'Smooth', value: 'smooth' },
                  { label: 'TypeWriter', value: 'typewriter' },
                  { label: 'Line by Line', value: 'lineByLine' },
                ]}
                onChange={(v) => setData('codeAnimation', {
                  ...((layer.data.codeAnimation as object) ?? {}),
                  type: v,
                })}
              />
            </Field>
            {(layer.data.codeAnimation as any)?.type !== 'none' && (
              <>
                <Row>
                  <Num
                    label="Duration (ms)"
                    value={Number((layer.data.codeAnimation as any)?.durationMs ?? 600)}
                    onChange={(v) => setData('codeAnimation', {
                      ...((layer.data.codeAnimation as object) ?? {}),
                      durationMs: Math.max(100, v),
                    })}
                  />
                  <Num
                    label="Delay (ms)"
                    value={Number((layer.data.codeAnimation as any)?.delayMs ?? 0)}
                    onChange={(v) => setData('codeAnimation', {
                      ...((layer.data.codeAnimation as object) ?? {}),
                      delayMs: Math.max(0, v),
                    })}
                  />
                </Row>
                <Field label="Easing">
                  <NativeSelect
                    value={String((layer.data.codeAnimation as any)?.easing ?? 'easeOut')}
                    options={[
                      { label: 'Linear', value: 'linear' },
                      { label: 'Ease In', value: 'easeIn' },
                      { label: 'Ease Out', value: 'easeOut' },
                      { label: 'Ease In Out', value: 'easeInOut' },
                    ]}
                    onChange={(v) => setData('codeAnimation', {
                      ...((layer.data.codeAnimation as object) ?? {}),
                      easing: v,
                    })}
                  />
                </Field>
              </>
            )}
          </Section>

          {/* ── Advanced Styles ────────────────────────────────────────── */}
          <Section title="Advanced styles">
            <div className="flex flex-col gap-3">
              <Field label="Blur">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={Number(layer.data.editorBlur ?? 0)}
                    onChange={(e) => setData('editorBlur', Number(e.target.value) || undefined)}
                    className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono w-10 text-right">{layer.data.editorBlur ? `${String(layer.data.editorBlur)}px` : '0px'}</span>
                </div>
              </Field>

              <Field label="Grayscale">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Number(layer.data.grayscale ?? 0)}
                    onChange={(e) => setData('grayscale', Number(e.target.value) || undefined)}
                    className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono w-10 text-right">{String(layer.data.grayscale ?? 0)}%</span>
                </div>
              </Field>

              <Field label="Sepia">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Number(layer.data.sepia ?? 0)}
                    onChange={(e) => setData('sepia', Number(e.target.value) || undefined)}
                    className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono w-10 text-right">{String(layer.data.sepia ?? 0)}%</span>
                </div>
              </Field>

              <Field label="Hue rotate">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={Number(layer.data.hueRotation ?? 0)}
                    onChange={(e) => setData('hueRotation', Number(e.target.value) || undefined)}
                    className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono w-10 text-right">{String(layer.data.hueRotation ?? 0)}°</span>
                </div>
              </Field>
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-3 border-t">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">Box shadow (Figma Slider)</span>
              {(() => {
                const shadow = parseBoxShadow(String(layer.data.boxShadow ?? ''))
                const updateShadow = (patch: Partial<ReturnType<typeof parseBoxShadow>>) => {
                  const s = { ...shadow, ...patch }
                  const str = stringifyBoxShadow(s.x, s.y, s.blur, s.spread, s.color)
                  setData('boxShadow', str)
                }

                return (
                  <div className="flex flex-col gap-3 mt-1">
                    <Field label="Offset X">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-50}
                          max={50}
                          value={shadow.x}
                          onChange={(e) => updateShadow({ x: Number(e.target.value) })}
                          className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono w-10 text-right">{shadow.x}px</span>
                      </div>
                    </Field>

                    <Field label="Offset Y">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-50}
                          max={50}
                          value={shadow.y}
                          onChange={(e) => updateShadow({ y: Number(e.target.value) })}
                          className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono w-10 text-right">{shadow.y}px</span>
                      </div>
                    </Field>

                    <Field label="Blur radius">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={shadow.blur}
                          onChange={(e) => updateShadow({ blur: Number(e.target.value) })}
                          className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono w-10 text-right">{shadow.blur}px</span>
                      </div>
                    </Field>

                    <Field label="Spread">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={-30}
                          max={50}
                          value={shadow.spread}
                          onChange={(e) => updateShadow({ spread: Number(e.target.value) })}
                          className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono w-10 text-right">{shadow.spread}px</span>
                      </div>
                    </Field>

                    <Color
                      label="Shadow Color"
                      value={shadow.color}
                      onChange={(v) => updateShadow({ color: v })}
                    />
                  </div>
                )
              })()}
            </div>
          </Section>
        </>
      )}

      {layer.type === 'arrow' && (() => {
        const STROKE_COLORS = ['#1e1e1e', '#ff4b4b', '#22c55e', '#2563eb', '#f97316']
        return (
          <Section title="Arrow properties">
            {/* Color Palette Selector */}
            <Field label="Stroke">
              <div className="flex items-center gap-2">
                {STROKE_COLORS.map((col) => {
                  const isSelected = layer.style.color === col
                  return (
                    <button
                      key={col}
                      onClick={() => setStyle('color', col)}
                      className={`size-6 rounded-full border transition-all hover:scale-110 ${
                        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500 scale-105' : 'border-neutral-200'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  )
                })}
                <div className="relative">
                  <input
                    type="color"
                    value={toHex(layer.style.color)}
                    onChange={(e) => setStyle('color', e.target.value)}
                    className="absolute inset-0 size-6 opacity-0 cursor-pointer"
                  />
                  <div
                    className={`size-6 rounded-full border border-dashed border-neutral-400 flex items-center justify-center text-[10px] text-neutral-500 font-bold hover:scale-110 transition-transform ${
                      !STROKE_COLORS.includes(layer.style.color || '') ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500' : ''
                    }`}
                    style={{
                      background: !STROKE_COLORS.includes(layer.style.color || '') ? layer.style.color : 'transparent',
                    }}
                  >
                    🎨
                  </div>
                </div>
              </div>
            </Field>

            {/* Stroke Width Buttons */}
            <Field label="Stroke width">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs">
                {[
                  { label: 'Thin', val: 2 },
                  { label: 'Medium', val: 4 },
                  { label: 'Thick', val: 8 },
                ].map((opt) => {
                  const isActive = (layer.style.borderWidth ?? 4) === opt.val
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setStyle('borderWidth', opt.val)}
                      className={`flex-1 py-1 px-3 text-center text-xs font-semibold rounded-md transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Stroke Style Segmented Buttons */}
            <Field label="Stroke style">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs">
                {[
                  { label: 'Solid', val: 'solid' },
                  { label: 'Dashed', val: 'dashed' },
                  { label: 'Dotted', val: 'dotted' },
                ].map((opt) => {
                  const isActive = String(layer.data.strokeDash ?? 'solid') === opt.val
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setData('strokeDash', opt.val)}
                      className={`flex-1 py-1 px-3 text-center text-xs font-semibold rounded-md transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Sloppiness Segmented Buttons */}
            <Field label="Sloppiness">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs">
                {[
                  { label: 'Architect', val: 0 },
                  { label: 'Artist', val: 1 },
                  { label: 'Cartoon', val: 2 },
                ].map((opt) => {
                  const isActive = Number(layer.data.sloppiness ?? 0) === opt.val
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setData('sloppiness', opt.val)}
                      className={`flex-1 py-1 px-2 text-center text-xs font-semibold rounded-md transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Arrow Type Segmented Buttons */}
            <Field label="Arrow type">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs">
                {[
                  { label: 'Straight', val: 'straight' },
                  { label: 'Curved', val: 'curved' },
                  { label: 'Elbow', val: 'corner' },
                ].map((opt) => {
                  const isActive = String(layer.data.bendType ?? 'straight') === opt.val
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setData('bendType', opt.val)}
                      className={`flex-1 py-1 px-2 text-center text-xs font-semibold rounded-md transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Arrowheads Buttons */}
            <Field label="Arrowheads">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-[160px]">
                {[
                  { label: 'None', val: 'none' },
                  { label: 'Arrow', val: 'arrow' },
                ].map((opt) => {
                  const isActive = String(layer.data.arrowhead ?? 'arrow') === opt.val
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setData('arrowhead', opt.val)}
                      className={`flex-1 py-1 px-3 text-center text-xs font-semibold rounded-md transition-all ${
                        isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Opacity Slider */}
            <Field label="Opacity">
              <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 pr-2">
                <span>0</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((layer.transform.opacity ?? 1) * 100)}
                  onChange={(e) => store.patchTransform(layer.id, { opacity: Number(e.target.value) / 100 })}
                  className="flex-1 accent-indigo-600 bg-muted rounded-lg appearance-none cursor-pointer h-1.5"
                />
                <span>100</span>
              </div>
            </Field>

            {/* Layers ordering */}
            <Field label="Layers">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs justify-between gap-1">
                {[
                  { label: 'To Back', action: 'back', icon: '⬇️' },
                  { label: 'Backward', action: 'backward', icon: '👇' },
                  { label: 'Forward', action: 'forward', icon: '👆' },
                  { label: 'To Front', action: 'front', icon: '⬆️' },
                ].map((opt) => {
                  return (
                    <button
                      key={opt.label}
                      title={opt.label}
                      onClick={() => {
                        const slide = store.getState().project.slides.find((s) => s.id === store.getState().currentSlideId)
                        if (!slide) return
                        const idx = slide.layers.findIndex((l) => l.id === layer.id)
                        if (idx < 0) return
                        let targetIdx = idx
                        if (opt.action === 'back') targetIdx = 0
                        else if (opt.action === 'backward') targetIdx = Math.max(0, idx - 1)
                        else if (opt.action === 'forward') targetIdx = Math.min(slide.layers.length - 1, idx + 1)
                        else if (opt.action === 'front') targetIdx = slide.layers.length - 1
                        store.reorderLayer(layer.id, targetIdx)
                      }}
                      className="flex-1 py-1 text-center rounded-md hover:bg-background transition-all border border-transparent hover:border-neutral-200"
                    >
                      <div className="text-xs">{opt.icon}</div>
                      <div className="text-[8px] text-neutral-500 mt-0.5 leading-none">{opt.label}</div>
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Quick Actions (Duplicate / Delete) */}
            <Field label="Actions">
              <div className="flex bg-muted p-0.5 rounded-lg border max-w-xs justify-between gap-1">
                <button
                  onClick={() => store.duplicateLayer(layer.id)}
                  className="flex-1 py-1 text-center text-xs font-semibold rounded-md hover:bg-background transition-all border border-transparent hover:border-neutral-200 text-neutral-700 flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  <span className="text-[10px]">Duplicate</span>
                </button>
                <button
                  onClick={() => store.deleteLayer(layer.id)}
                  className="flex-1 py-1 text-center text-xs font-semibold rounded-md hover:bg-background transition-all border border-transparent hover:border-neutral-200 text-red-600 flex items-center justify-center gap-1.5"
                >
                  <span>🗑️</span>
                  <span className="text-[10px]">Delete</span>
                </button>
              </div>
            </Field>

            {/* Annotation Label Text Input */}
            <Field label="Annotation label">
              <Input
                className="h-7"
                placeholder="e.g. RPC Call"
                value={String(layer.data.text ?? '')}
                onChange={(e) => setData('text', e.target.value)}
              />
            </Field>
          </Section>
        )
      })()}

      <Section title="Transform">
        <Row>
          <button
            onClick={() => setData('flipH', !layer.data.flipH)}
            className={tglClass(!!layer.data.flipH)}
          >
            Flip H
          </button>
          <button
            onClick={() => setData('flipV', !layer.data.flipV)}
            className={tglClass(!!layer.data.flipV)}
          >
            Flip V
          </button>
        </Row>
        <Row>
          <Num label="Skew X" value={Number(layer.data.skewX ?? 0)} onChange={(v) => setData('skewX', v)} />
          <Num label="Skew Y" value={Number(layer.data.skewY ?? 0)} onChange={(v) => setData('skewY', v)} />
        </Row>
        
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">3D Perspective Space</span>
          
          <Field label="Perspective">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={Number(layer.data.perspective ?? 0)}
                onChange={(e) => setData('perspective', Number(e.target.value) || undefined)}
                className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
              />
              <span className="text-xs font-mono w-12 text-right">{layer.data.perspective ? `${String(layer.data.perspective)}px` : 'None'}</span>
            </div>
          </Field>

          <Field label="Rotate X (tilt)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-180}
                max={180}
                value={Number(layer.data.rotateX ?? 0)}
                onChange={(e) => setData('rotateX', Number(e.target.value))}
                className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
              />
              <span className="text-xs font-mono w-12 text-right">{String(layer.data.rotateX ?? 0)}°</span>
            </div>
          </Field>

          <Field label="Rotate Y (pan)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-180}
                max={180}
                value={Number(layer.data.rotateY ?? 0)}
                onChange={(e) => setData('rotateY', Number(e.target.value))}
                className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
              />
              <span className="text-xs font-mono w-12 text-right">{String(layer.data.rotateY ?? 0)}°</span>
            </div>
          </Field>

          <Field label="Rotate Z (roll)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-180}
                max={180}
                value={Number(layer.data.rotateZ ?? 0)}
                onChange={(e) => setData('rotateZ', Number(e.target.value))}
                className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
              />
              <span className="text-xs font-mono w-12 text-right">{String(layer.data.rotateZ ?? 0)}°</span>
            </div>
          </Field>

          <Field label="Translate Z (height)">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-200}
                max={400}
                value={Number(layer.data.translateZ ?? 0)}
                onChange={(e) => setData('translateZ', Number(e.target.value))}
                className="flex-1 accent-indigo-600 bg-muted h-1 rounded cursor-pointer"
              />
              <span className="text-xs font-mono w-12 text-right">{String(layer.data.translateZ ?? 0)}px</span>
            </div>
          </Field>
        </div>

        <div className="mt-3 pt-3 border-t">
          <Field label="Custom CSS transform">
            <textarea
              className="min-h-16 w-full resize-y rounded-md border bg-transparent p-2 font-mono text-xs"
              placeholder="e.g. perspective(500px) rotateY(20deg) skewX(8deg)"
              value={String(layer.data.transform ?? '')}
              onChange={(e) => setData('transform', e.target.value)}
            />
          </Field>
        </div>
      </Section>
    </>
  )
}

function range(layer: Layer): [number, number] {
  const r = layer.data.visibleRange as [number, number] | undefined
  if (r) return r
  const files = layer.data.files as import('../components/code-block').CodeFile[] | undefined
  const active = (layer.data.activeFile as number | undefined) ?? 0
  const code = files && files.length > 0
    ? (files[active]?.code ?? '')
    : ((layer.data.code as string) ?? '')
  const totalLines = Math.max(1, code.split('\n').length)
  return [1, totalLines]
}

function lineList(v: unknown): string {
  return Array.isArray(v) ? (v as number[]).join(',') : ''
}

function parseLineList(s: string): number[] {
  return s
    .split(',')
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => Number.isFinite(n))
}

function tglClass(active: boolean): string {
  return (
    'rounded-md border px-2 py-1 text-xs hover:bg-muted ' +
    (active ? 'border-primary bg-primary/10 text-primary' : '')
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
        <Field label="Gradients">
          <div className="flex flex-wrap gap-1.5">
            {GRADIENTS.map((g) => (
              <button
                key={g}
                title="Apply gradient"
                onClick={() => store.patchSlide(slide.id, { background: g })}
                className="size-7 rounded-md border"
                style={{ background: g }}
              />
            ))}
          </div>
        </Field>
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
        <Field label="Speaker notes">
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

function Toggle({
  active,
  onChange,
  label,
}: {
  active: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={
        'h-7 w-full rounded-md border px-2 text-xs text-left hover:bg-muted ' +
        (active ? 'border-primary bg-primary/10 text-primary' : '')
      }
    >
      {label ?? (active ? 'On' : 'Off')}
    </button>
  )
}

function hasStyle(layer: Layer): boolean {
  return Object.keys(layer.style).length > 0
}

function toHex(value?: string): string {
  return value && /^#[0-9a-f]{3,8}$/i.test(value) ? value : '#000000'
}

