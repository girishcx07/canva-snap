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
} from 'lucide-react'
import type { ReactNode } from 'react'

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

// --- Built-in components ----------------------------------------------------

registerComponent({
  type: 'text',
  label: 'Text',
  category: 'text',
  icon: TypeIcon,
  defaultData: () => ({ text: 'Add your text' }),
  defaultStyle: () => ({ fontSize: 24, color: 'var(--foreground)', textAlign: 'left' }),
  fields: [{ key: 'text', label: 'Text', type: 'textarea' }],
  render: ({ layer }) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: layer.style.fontSize,
        fontWeight: layer.style.fontWeight,
        color: layer.style.color,
        textAlign: layer.style.textAlign,
        justifyContent:
          layer.style.textAlign === 'center'
            ? 'center'
            : layer.style.textAlign === 'right'
              ? 'flex-end'
              : 'flex-start',
      }}
    >
      {String(layer.data.text ?? '')}
    </div>
  ),
})

registerComponent({
  type: 'heading',
  label: 'Heading',
  category: 'text',
  icon: HeadingIcon,
  defaultData: () => ({ text: 'Big Heading' }),
  defaultTransform: () => ({ width: 520, height: 90 }),
  defaultStyle: () => ({ fontSize: 56, fontWeight: 800, color: 'var(--foreground)' }),
  fields: [{ key: 'text', label: 'Heading', type: 'text' }],
  render: ({ layer }) => (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: layer.style.fontSize,
        fontWeight: layer.style.fontWeight ?? 800,
        color: layer.style.color,
        letterSpacing: '-0.02em',
        textAlign: layer.style.textAlign,
      }}
    >
      {String(layer.data.text ?? '')}
    </div>
  ),
})

registerComponent({
  type: 'shape',
  label: 'Shape',
  category: 'layouts',
  icon: SquareIcon,
  defaultData: () => ({ shape: 'rect' }),
  defaultStyle: () => ({ fill: 'var(--primary)', borderRadius: 16 }),
  fields: [
    {
      key: 'shape',
      label: 'Shape',
      type: 'select',
      options: [
        { label: 'Rectangle', value: 'rect' },
        { label: 'Ellipse', value: 'ellipse' },
        { label: 'Pill', value: 'pill' },
      ],
    },
  ],
  render: ({ layer }) => {
    const shape = String(layer.data.shape ?? 'rect')
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: layer.style.fill,
          border: layer.style.borderWidth
            ? `${layer.style.borderWidth}px solid ${layer.style.borderColor ?? 'transparent'}`
            : undefined,
          borderRadius:
            shape === 'ellipse'
              ? '50%'
              : shape === 'pill'
                ? 9999
                : (layer.style.borderRadius ?? 0),
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
  defaultStyle: () => ({ color: 'var(--primary)' }),
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
    fill: 'var(--primary)',
    color: 'var(--primary-foreground)',
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
        transform: `rotate(${layer.transform.rotation}deg) scale(${layer.transform.scale})`,
      }}
    >
      <LayerView layer={layer} mode={mode} />
    </div>
  )
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
