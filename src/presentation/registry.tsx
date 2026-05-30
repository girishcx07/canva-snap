'use client'

// Component registry. Every layer `type` maps to a ComponentDefinition that owns
// its defaults, an inspector field schema, and a renderer. New component kinds
// register here without touching the editor, runtime, store or types.

import {
  ArrowRightIcon,
  CheckIcon,
  CodeIcon,
  HeartIcon,
  type LucideIcon,
  MousePointerClickIcon,
  RocketIcon,
  SparklesIcon,
  SquareIcon,
  StarIcon,
  ZapIcon,
  ImageIcon,
  TypeIcon,
  HeadingIcon,
  BoxIcon,
  GlobeIcon,
  FolderTreeIcon,
  AppWindowIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { defaultTransform, uid } from './doc'
import type { Layer, LayerStyle, Transform } from './types'
import { CodeBlock, type CodeBlockData } from './components/code-block'
import { codeLanguages } from '@/lib/code-highlighter'

export type ComponentCategory =
  | 'text'
  | 'media'
  | 'code'
  | 'layouts'
  | 'interactive'

export type FieldType = 'text' | 'textarea' | 'number' | 'color' | 'select'

export type Field = {
  key: string
  label: string
  type: FieldType
  options?: { label: string; value: string }[]
}

export type RenderMode = 'editor' | 'present'

export type ComponentDefinition = {
  type: string
  label: string
  category: ComponentCategory
  icon: LucideIcon
  // Components that capture pointer input when selected (e.g. scrollable code).
  interactive?: boolean
  defaultData: () => Record<string, unknown>
  defaultTransform?: () => Partial<Transform>
  defaultStyle?: () => LayerStyle
  fields?: Field[]
  render: (ctx: {
    layer: Layer
    mode: RenderMode
    selected?: boolean
    update?: (patch: Partial<Layer>) => void
  }) => ReactNode
}

const registry = new Map<string, ComponentDefinition>()

export function registerComponent(def: ComponentDefinition): void {
  registry.set(def.type, def)
}

export function getComponent(type: string): ComponentDefinition | undefined {
  return registry.get(type)
}

export function listComponents(): ComponentDefinition[] {
  return [...registry.values()]
}

export function componentsByCategory(
  category: ComponentCategory,
): ComponentDefinition[] {
  return listComponents().filter((c) => c.category === category)
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  'text',
  'media',
  'code',
  'layouts',
  'interactive',
]

const ICONS: Record<string, LucideIcon> = {
  sparkles: SparklesIcon,
  star: StarIcon,
  zap: ZapIcon,
  heart: HeartIcon,
  check: CheckIcon,
  arrow: ArrowRightIcon,
  code: CodeIcon,
  rocket: RocketIcon,
}

// --- Renders a layer (and nested children) through the registry -------------

export function LayerView({
  layer,
  mode,
  selected,
  update,
}: {
  layer: Layer
  mode: RenderMode
  selected?: boolean
  update?: (patch: Partial<Layer>) => void
}) {
  const def = getComponent(layer.type)
  if (!def) return null
  return <>{def.render({ layer, mode, selected, update })}</>
}

// Uncontrolled rich-text contentEditable. Stores HTML; shows a floating
// formatting toolbar on selection. Syncs from props only when the DOM differs
// so typing doesn't reset the caret.
function EditableText({
  value,
  onChange,
  style,
}: {
  value: string
  onChange: (v: string) => void
  style: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tb, setTb] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  function checkSelection() {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && ref.current?.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0).getBoundingClientRect()
      setTb({ x: r.left + r.width / 2, y: r.top })
    } else {
      setTb(null)
    }
  }
  function cmd(c: string) {
    document.execCommand(c)
    onChange(ref.current?.innerHTML ?? '')
  }

  return (
    <>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onBlur={() => setTb(null)}
        onPointerDown={(e) => e.stopPropagation()}
        style={style}
      />
      {tb &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[60] flex -translate-x-1/2 -translate-y-full gap-0.5 rounded-md border bg-popover p-1 text-sm shadow-md"
            style={{ left: tb.x, top: tb.y - 6 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button onClick={() => cmd('bold')} className="size-6 rounded font-bold hover:bg-muted">B</button>
            <button onClick={() => cmd('italic')} className="size-6 rounded italic hover:bg-muted">I</button>
            <button onClick={() => cmd('underline')} className="size-6 rounded underline hover:bg-muted">U</button>
          </div>,
          document.body,
        )}
    </>
  )
}

// --- Built-in components ----------------------------------------------------

const SHAPE_CLIP: Record<string, string | undefined> = {
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
}

registerComponent({
  type: 'text',
  label: 'Text',
  category: 'text',
  icon: TypeIcon,
  interactive: true,
  defaultData: () => ({ text: 'Add your text' }),
  defaultStyle: () => ({ fontSize: 24, color: 'var(--foreground)', textAlign: 'left' }),
  fields: [{ key: 'text', label: 'Text', type: 'textarea' }],
  render: ({ layer, mode, selected, update }) => {
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      fontSize: layer.style.fontSize,
      fontWeight: layer.style.fontWeight,
      color: layer.style.color,
      textAlign: layer.style.textAlign,
      fontFamily: layer.style.fontFamily,
      justifyContent:
        layer.style.textAlign === 'center'
          ? 'center'
          : layer.style.textAlign === 'right'
            ? 'flex-end'
            : 'flex-start',
      outline: 'none',
    }
    if (mode === 'editor' && selected && update) {
      return (
        <EditableText
          value={String(layer.data.text ?? '')}
          style={style}
          onChange={(text) => update({ data: { ...layer.data, text } })}
        />
      )
    }
    return <div style={style} dangerouslySetInnerHTML={{ __html: String(layer.data.text ?? '') }} />
  },
})

registerComponent({
  type: 'heading',
  label: 'Heading',
  category: 'text',
  icon: HeadingIcon,
  interactive: true,
  defaultData: () => ({ text: 'Big Heading' }),
  defaultTransform: () => ({ width: 520, height: 90 }),
  defaultStyle: () => ({ fontSize: 56, fontWeight: 800, color: 'var(--foreground)' }),
  fields: [{ key: 'text', label: 'Heading', type: 'text' }],
  render: ({ layer, mode, selected, update }) => {
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      fontSize: layer.style.fontSize,
      fontWeight: layer.style.fontWeight ?? 800,
      color: layer.style.color,
      letterSpacing: '-0.02em',
      textAlign: layer.style.textAlign,
      fontFamily: layer.style.fontFamily,
      outline: 'none',
    }
    if (mode === 'editor' && selected && update) {
      return (
        <EditableText
          value={String(layer.data.text ?? '')}
          style={style}
          onChange={(text) => update({ data: { ...layer.data, text } })}
        />
      )
    }
    return <div style={style} dangerouslySetInnerHTML={{ __html: String(layer.data.text ?? '') }} />
  },
})

registerComponent({
  type: 'shape',
  label: 'Shape',
  category: 'layouts',
  icon: SquareIcon,
  defaultData: () => ({ shape: 'rect' }),
  defaultStyle: () => ({ fill: '#64748b', borderRadius: 16 }),
  fields: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      options: [
        { label: 'Rectangle', value: 'rect' },
        { label: 'Rounded', value: 'rounded' },
        { label: 'Circle', value: 'circle' },
        { label: 'Pill', value: 'pill' },
        { label: 'Triangle', value: 'triangle' },
        { label: 'Diamond', value: 'diamond' },
        { label: 'Star', value: 'star' },
        { label: 'Line', value: 'line' },
      ],
    },
  ],
  render: ({ layer }) => {
    const shape = String(layer.data.shape ?? 'rect')
    const clip = SHAPE_CLIP[shape]
    return (
      <div
        style={{
          width: '100%',
          height: shape === 'line' ? (layer.style.borderWidth ?? 6) : '100%',
          marginTop: shape === 'line' ? `calc(50% - ${(layer.style.borderWidth ?? 6) / 2}px)` : undefined,
          background: layer.style.fill,
          border:
            !clip && layer.style.borderWidth
              ? `${layer.style.borderWidth}px solid ${layer.style.borderColor ?? 'transparent'}`
              : undefined,
          borderRadius: clip
            ? 0
            : shape === 'circle'
              ? '50%'
              : shape === 'pill'
                ? 9999
                : shape === 'rounded'
                  ? (layer.style.borderRadius ?? 16)
                  : 0,
          clipPath: clip,
          boxShadow: layer.style.shadow,
        }}
      />
    )
  },
})

registerComponent({
  type: 'image',
  label: 'Image',
  category: 'media',
  icon: ImageIcon,
  defaultData: () => ({
    src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
    alt: 'Image',
  }),
  defaultTransform: () => ({ width: 320, height: 200 }),
  defaultStyle: () => ({ borderRadius: 12 }),
  fields: [
    { key: 'src', label: 'Image URL', type: 'text' },
    { key: 'alt', label: 'Alt text', type: 'text' },
  ],
  render: ({ layer }) => (
    <img
      src={String(layer.data.src ?? '')}
      alt={String(layer.data.alt ?? '')}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: layer.style.borderRadius,
      }}
    />
  ),
})

registerComponent({
  type: 'icon',
  label: 'Icon',
  category: 'media',
  icon: SparklesIcon,
  defaultData: () => ({ name: 'sparkles' }),
  defaultTransform: () => ({ width: 96, height: 96 }),
  defaultStyle: () => ({ color: '#334155' }),
  fields: [
    {
      key: 'name',
      label: 'Icon',
      type: 'select',
      options: Object.keys(ICONS).map((k) => ({ label: k, value: k })),
    },
  ],
  render: ({ layer }) => {
    const Icon = ICONS[String(layer.data.name ?? 'sparkles')] ?? SparklesIcon
    return (
      <Icon
        style={{ width: '100%', height: '100%', color: layer.style.color }}
        strokeWidth={1.5}
      />
    )
  },
})

registerComponent({
  type: 'svg',
  label: 'SVG',
  category: 'media',
  icon: SparklesIcon,
  defaultData: () => ({ markup: '' }),
  defaultTransform: () => ({ width: 96, height: 96 }),
  defaultStyle: () => ({ color: '#111827' }),
  render: ({ layer }) => (
    <div
      className="[&>svg]:size-full"
      style={{ width: '100%', height: '100%', color: layer.style.color }}
      dangerouslySetInnerHTML={{ __html: String(layer.data.markup ?? '') }}
    />
  ),
})

registerComponent({
  type: 'code',
  label: 'Code',
  category: 'code',
  icon: CodeIcon,
  interactive: true,
  defaultData: () =>
    ({
      code: 'function hello() {\n  return "world"\n}',
      language: 'typescript',
      showLineNumbers: true,
    }) satisfies CodeBlockData,
  defaultTransform: () => ({ width: 520, height: 280 }),
  fields: [
    {
      key: 'language',
      label: 'Language',
      type: 'select',
      options: codeLanguages.map((l) => ({ label: l, value: l })),
    },
  ],
  render: ({ layer, mode, selected, update }) => (
    <CodeBlock
      data={layer.data as CodeBlockData}
      className="h-full w-full"
      mode={mode}
      interactive={mode === 'editor' && !!selected}
      onChange={
        update
          ? (code) => update({ data: { ...layer.data, code } })
          : undefined
      }
    />
  ),
})

registerComponent({
  type: 'container',
  label: 'Container',
  category: 'layouts',
  icon: BoxIcon,
  defaultData: () => ({}),
  defaultTransform: () => ({ width: 400, height: 300 }),
  defaultStyle: () => ({
    fill: 'var(--muted)',
    borderRadius: 16,
    padding: 16,
  }),
  render: ({ layer, mode }) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: layer.style.fill,
        borderRadius: layer.style.borderRadius,
        position: 'relative',
      }}
    >
      {(layer.children ?? []).map((child) => (
        <PositionedChild key={child.id} layer={child} mode={mode} />
      ))}
    </div>
  ),
})

registerComponent({
  type: 'button',
  label: 'Button',
  category: 'interactive',
  icon: MousePointerClickIcon,
  defaultData: () => ({ label: 'Click me' }),
  defaultTransform: () => ({ width: 160, height: 52 }),
  defaultStyle: () => ({
    fill: '#3b82f6',
    color: '#ffffff',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
  }),
  fields: [{ key: 'label', label: 'Label', type: 'text' }],
  render: ({ layer }) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: layer.style.fill,
        color: layer.style.color,
        borderRadius: layer.style.borderRadius,
        fontSize: layer.style.fontSize,
        fontWeight: layer.style.fontWeight,
      }}
    >
      {String(layer.data.label ?? 'Button')}
    </div>
  ),
})

registerComponent({
  type: 'arrow',
  label: 'Arrow',
  category: 'layouts',
  icon: ArrowRightIcon,
  defaultData: () => ({}),
  defaultTransform: () => ({ width: 220, height: 40 }),
  defaultStyle: () => ({ color: '#ffffff', borderWidth: 4 }),
  render: ({ layer }) => {
    const w = layer.transform.width
    const h = layer.transform.height
    const c = layer.style.color ?? '#ffffff'
    const sw = layer.style.borderWidth ?? 4
    return (
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <line x1={0} y1={h / 2} x2={w - 14} y2={h / 2} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <polygon
          points={`${w - 16},${h / 2 - 9} ${w},${h / 2} ${w - 16},${h / 2 + 9}`}
          fill={c}
        />
      </svg>
    )
  },
})

registerComponent({
  type: 'browser',
  label: 'Browser',
  category: 'code',
  icon: GlobeIcon,
  defaultData: () => ({ url: 'https://example.com', src: '' }),
  defaultTransform: () => ({ width: 640, height: 420 }),
  defaultStyle: () => ({ borderRadius: 12 }),
  fields: [
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'src', label: 'Screenshot URL', type: 'text' },
  ],
  render: ({ layer }) => (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow-lg">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted px-3">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <div className="ml-2 flex-1 truncate rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {String(layer.data.url ?? '')}
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-background">
        {layer.data.src ? (
          <img src={String(layer.data.src)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            {String(layer.data.url ?? 'Browser preview')}
          </div>
        )}
      </div>
    </div>
  ),
})

registerComponent({
  type: 'file-tree',
  label: 'File tree',
  category: 'code',
  icon: FolderTreeIcon,
  defaultData: () => ({ files: ['src/', '  index.ts', '  app.tsx', 'package.json', 'README.md'] }),
  defaultTransform: () => ({ width: 260, height: 360 }),
  defaultStyle: () => ({ borderRadius: 12 }),
  render: ({ layer }) => {
    const files = (layer.data.files as string[]) ?? []
    return (
      <div className="h-full w-full overflow-auto rounded-xl border bg-card p-2 font-mono text-xs">
        <div className="px-1 pb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
          Explorer
        </div>
        {files.map((f, i) => {
          const indent = f.length - f.trimStart().length
          const name = f.trim()
          const folder = name.endsWith('/')
          return (
            <div key={i} className="flex items-center gap-1 py-0.5" style={{ paddingLeft: indent * 8 }}>
              {folder ? <FolderTreeIcon className="size-3.5 text-sky-500" /> : <CodeIcon className="size-3.5 text-muted-foreground" />}
              <span>{name}</span>
            </div>
          )
        })}
      </div>
    )
  },
})

registerComponent({
  type: 'sandbox',
  label: 'Sandbox',
  category: 'code',
  icon: AppWindowIcon,
  interactive: true,
  defaultData: () => ({
    html: '<style>body{font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0}</style>\n<h1>Live preview</h1>',
  }),
  defaultTransform: () => ({ width: 520, height: 360 }),
  defaultStyle: () => ({ borderRadius: 12 }),
  fields: [{ key: 'html', label: 'HTML', type: 'textarea' }],
  render: ({ layer }) => (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card shadow">
      <div className="flex h-7 shrink-0 items-center gap-1 border-b bg-muted px-3 text-[11px] text-muted-foreground">
        <AppWindowIcon className="size-3.5" /> preview
      </div>
      <iframe
        title="sandbox"
        sandbox="allow-scripts"
        srcDoc={String(layer.data.html ?? '')}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  ),
})

function PositionedChild({ layer, mode }: { layer: Layer; mode: RenderMode }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.transform.x,
        top: layer.transform.y,
        width: layer.transform.width,
        height: layer.transform.height,
        opacity: layer.transform.opacity,
        transform: `rotate(${layer.transform.rotation}deg) scale(${layer.transform.scale})${extraTransform(layer)}`,
      }}
    >
      <LayerView layer={layer} mode={mode} />
    </div>
  )
}

// Composes extra CSS transforms (flip/skew/raw) layered on top of the base
// position+rotation+scale. The raw `transform` string enables any CSS transform
// (matrix, rotate3d, perspective, skew, translateZ, ...).
export function extraTransform(layer: Layer): string {
  const d = layer.data as Record<string, unknown>
  const parts: string[] = []
  if (d.flipH) parts.push('scaleX(-1)')
  if (d.flipV) parts.push('scaleY(-1)')
  if (d.skewX) parts.push(`skewX(${Number(d.skewX)}deg)`)
  if (d.skewY) parts.push(`skewY(${Number(d.skewY)}deg)`)
  if (typeof d.transform === 'string' && d.transform.trim()) parts.push(d.transform.trim())
  return parts.length ? ' ' + parts.join(' ') : ''
}

// Helper used by the editor when creating a new layer of a given type.
export function createLayerOfType(type: string, id: string): Layer | null {
  const def = getComponent(type)
  if (!def) return null
  return {
    id,
    type,
    name: def.label,
    transform: defaultTransform(def.defaultTransform?.()),
    style: def.defaultStyle?.() ?? {},
    locked: false,
    hidden: false,
    data: def.defaultData(),
    animations: [],
    events: [],
  }
}

// Create a layer centered on a slide of the given size, with optional overrides.
export function createCenteredLayer(
  type: string,
  slideSize: { width: number; height: number },
  patch?: {
    data?: Record<string, unknown>
    style?: LayerStyle
    transform?: Partial<Transform>
  },
): Layer | null {
  const layer = createLayerOfType(type, uid('layer'))
  if (!layer) return null
  if (patch?.data) layer.data = { ...layer.data, ...patch.data }
  if (patch?.style) layer.style = { ...layer.style, ...patch.style }
  if (patch?.transform) layer.transform = { ...layer.transform, ...patch.transform }
  layer.transform.x = Math.round(slideSize.width / 2 - layer.transform.width / 2)
  layer.transform.y = Math.round(slideSize.height / 2 - layer.transform.height / 2)
  return layer
}
