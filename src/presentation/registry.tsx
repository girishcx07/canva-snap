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
import type { SampledFrame } from './engine/animation'

export function getSlideLayers(): Layer[] {
  if (typeof window === 'undefined') return []
  return (window as any)._activeSlide?.layers ?? []
}

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
    frame?: SampledFrame
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
  frame,
}: {
  layer: Layer
  mode: RenderMode
  selected?: boolean
  update?: (patch: Partial<Layer>) => void
  frame?: SampledFrame
}) {
  const def = getComponent(layer.type)
  if (!def) return null
  return <>{def.render({ layer, mode, selected, update, frame })}</>
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
  defaultStyle: () => ({ fontSize: 24, color: '#000000', textAlign: 'left' }),
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
  defaultStyle: () => ({ fontSize: 56, fontWeight: 800, color: '#000000' }),
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
  defaultStyle: () => ({ fill: '#000000', borderRadius: 16 }),
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
          boxShadow: layer.style.shadow ?? layer.style.boxShadow ?? (layer.data.boxShadow as string | undefined),
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
      lineNumberStart: 1,
      tabSize: 2,
      showWindowChrome: true,
      showAccentColor: true,
      highlightOpacity: 100,
      highlightFilter: 'none',
      codeAnimation: { type: 'none', durationMs: 600, delayMs: 0, easing: 'easeOut' },
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
  render: ({ layer, mode, selected, update, frame }) => {
    const dataWithShadow = {
      ...layer.data,
      boxShadow: layer.data.boxShadow ?? layer.style.boxShadow ?? layer.style.shadow
    } as CodeBlockData
    return (
      <CodeBlock
        data={dataWithShadow}
        className="h-full w-full"
        mode={mode}
      interactive={mode === 'editor' && !!selected}
      onChange={
        update
          ? (code) => {
              const files = layer.data.files as import('./components/code-block').CodeFile[] | undefined
              if (files && files.length > 0) {
                const active = (layer.data.activeFile as number | undefined) ?? 0
                const updatedFiles = [...files]
                if (updatedFiles[active]) {
                  updatedFiles[active] = { ...updatedFiles[active], code }
                }
                update({ data: { ...layer.data, files: updatedFiles } })
              } else {
                update({ data: { ...layer.data, code } })
              }
            }
          : undefined
      }
      onChangeTitle={
        update && mode === 'editor'
          ? (title) => {
              const files = layer.data.files as import('./components/code-block').CodeFile[] | undefined
              if (files && files.length > 0) {
                const active = (layer.data.activeFile as number | undefined) ?? 0
                const updatedFiles = [...files]
                if (updatedFiles[active]) {
                  updatedFiles[active] = { ...updatedFiles[active], name: title }
                }
                update({ data: { ...layer.data, files: updatedFiles } })
              } else {
                update({ data: { ...layer.data, title } })
              }
            }
          : undefined
      }
      onChangeActiveFile={
        update && mode === 'editor'
          ? (activeFile) => update({ data: { ...layer.data, activeFile } })
          : undefined
      }
      onChangeRange={
        update && mode === 'editor'
          ? (range) => update({ data: { ...layer.data, visibleRange: range } })
          : undefined
      }
      onAddFile={
        update && mode === 'editor'
          ? () => {
              const files = layer.data.files as import('./components/code-block').CodeFile[] | undefined
              const existing = files && files.length > 0
                ? files
                : [{
                    name: (layer.data.title as string | undefined) ?? 'main.ts',
                    code: (layer.data.code as string | undefined) ?? '',
                    language: (layer.data.language as string | undefined) ?? 'typescript'
                  }]
              const newFile = { name: 'untitled.ts', code: '', language: 'typescript' }
              const updatedFiles = [...existing, newFile]
              update({
                data: {
                  ...layer.data,
                  files: updatedFiles,
                  activeFile: updatedFiles.length - 1
                }
              })
            }
          : undefined
      }
      onRemoveFile={
        update && mode === 'editor'
          ? (index) => {
              const files = layer.data.files as import('./components/code-block').CodeFile[] | undefined
              const visibleFiles = files && files.length > 0
                ? files
                : [{
                    name: (layer.data.title as string | undefined) ?? 'main.ts',
                    code: (layer.data.code as string | undefined) ?? '',
                    language: (layer.data.language as string | undefined) ?? 'typescript'
                  }]
              const updatedFiles = visibleFiles.filter((_, i) => i !== index)
              const active = (layer.data.activeFile as number | undefined) ?? 0
              const nextActive = Math.max(0, active >= updatedFiles.length ? updatedFiles.length - 1 : active)
              
              if (updatedFiles.length > 1) {
                update({
                  data: {
                    ...layer.data,
                    files: updatedFiles,
                    activeFile: nextActive
                  }
                })
              } else if (updatedFiles.length === 1) {
                update({
                  data: {
                    ...layer.data,
                    files: undefined,
                    activeFile: undefined,
                    title: updatedFiles[0].name,
                    code: updatedFiles[0].code,
                    language: updatedFiles[0].language
                  }
                })
              }
            }
          : undefined
      }
      fromCode={(frame as any)?.fromCode}
      animProgress={(frame as any)?.animProgress}
    />
    )
  },
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
    fill: '#000000',
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
  defaultData: () => ({ bendType: 'straight' }),
  defaultTransform: () => ({ width: 220, height: 40 }),
  defaultStyle: () => ({ color: '#000000', borderWidth: 4 }),
  fields: [
    {
      key: 'bendType',
      label: 'Bend Style',
      type: 'select',
      options: [
        { label: 'Straight Line', value: 'straight' },
        { label: 'Elbow Corner', value: 'corner' },
        { label: 'Smooth Curved', value: 'curved' },
      ],
    },
    {
      key: 'strokeDash',
      label: 'Line Style',
      type: 'select',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
      ],
    },
    {
      key: 'intersectStyle',
      label: 'Overlap Style',
      type: 'select',
      options: [
        { label: 'None (Solid/Uniform)', value: 'none' },
        { label: 'Dotted Inside Elements', value: 'dotted' },
        { label: 'Dashed Inside Elements', value: 'dashed' },
      ],
    },
  ],
  render: ({ layer, mode, frame }) => {
    const w = layer.transform.width
    const h = layer.transform.height
    const c = layer.style.color ?? '#ffffff'
    const sw = layer.style.borderWidth ?? 4

    // Check if there is an active draw animation configured
    const anim = layer.animations.find(
      (a) => a.presetId === 'draw'
    )
    
    // Determine direction and exit status
    const direction = anim?.direction ?? 'forward'
    const isExit = anim?.trigger === 'slide-exit'
    const duration = anim?.durationMs ?? 800
    const delay = anim?.delayMs ?? 0
    const easing = anim?.easing ?? 'easeOut'
    
    // Define bend styles and paths
    const bendType = String(layer.data.bendType ?? 'straight')
    
    // Resolve absolute coordinates relative to the current bounding box transform
    const relX1 = layer.data.startX !== undefined ? (Number(layer.data.startX) - layer.transform.x) : 0
    const relY1 = layer.data.startY !== undefined ? (Number(layer.data.startY) - layer.transform.y) : h / 2
    const relX2 = layer.data.endX !== undefined ? (Number(layer.data.endX) - layer.transform.x) : w
    const relY2 = layer.data.endY !== undefined ? (Number(layer.data.endY) - layer.transform.y) : h / 2
    const relCx = layer.data.controlX !== undefined ? (Number(layer.data.controlX) - layer.transform.x) : (relX1 + relX2) / 2
    const relCy = layer.data.controlY !== undefined ? (Number(layer.data.controlY) - layer.transform.y) : (relY1 + relY2) / 2
    
    let pathD = ''
    let totalLength = w - 14
    let angleDeg = 0
    
    if (bendType === 'straight') {
      const dx = relX2 - relX1
      const dy = relY2 - relY1
      const angleRad = Math.atan2(dy, dx)
      angleDeg = (angleRad * 180) / Math.PI
      const dist = Math.hypot(dx, dy)
      const endRatio = dist > 0 ? Math.max(0, dist - 14) / dist : 0
      const lineEndX = relX1 + dx * endRatio
      const lineEndY = relY1 + dy * endRatio
      
      pathD = `M ${relX1},${relY1} L ${lineEndX},${lineEndY}`
      totalLength = Math.max(0, dist - 14)
    } else if (bendType === 'corner') {
      // Stepped elbow corner (L-shape/elbow)
      const goingRight = relX2 >= relCx
      const lineEndX = goingRight ? relX2 - 14 : relX2 + 14
      pathD = `M ${relX1},${relY1} L ${relCx},${relY1} L ${relCx},${relCy} L ${relCx},${relY2} L ${lineEndX},${relY2}`
      totalLength = Math.abs(relCx - relX1) + Math.abs(relY2 - relY1) + Math.max(0, Math.abs(relX2 - relCx) - 14)
      angleDeg = goingRight ? 0 : 180
    } else if (bendType === 'curved') {
      // Smooth bend (quadratic Bezier)
      const dx = relX2 - relCx
      const dy = relY2 - relCy
      const angleRad = Math.atan2(dy, dx)
      angleDeg = (angleRad * 180) / Math.PI
      
      const lineEndX = relX2 - Math.cos(angleRad) * 14
      const lineEndY = relY2 - Math.sin(angleRad) * 14
      
      pathD = `M ${relX1},${relY1} Q ${relCx},${relCy} ${lineEndX},${lineEndY}`
      totalLength = Math.hypot(relCx - relX1, relCy - relY1) + Math.hypot(relX2 - relCx, relY2 - relCy) - 14
    }

    // Default values (fully drawn)
    let strokeDasharray: string | undefined = undefined
    let strokeDashoffset: number | undefined = undefined
    let headScale = 1

    const strokeDash = String(layer.data.strokeDash ?? 'solid')
    if (strokeDash === 'dashed') {
      strokeDasharray = '8, 8'
    } else if (strokeDash === 'dotted') {
      strokeDasharray = '2, 6'
    }

    const intersectStyle = String(layer.data.intersectStyle ?? 'none')
    const otherLayers = getSlideLayers().filter((ol) => ol.id !== layer.id && !ol.hidden)
    const hasOverlap = intersectStyle !== 'none' && otherLayers.length > 0
    const maskId = `arrow-mask-${layer.id}`
    const dottedMaskId = `arrow-mask-dotted-${layer.id}`

    const textStr = String(layer.data.text ?? '')
    const isEditing = typeof window !== 'undefined' && (window as any)._editingArrowId === layer.id
    const hasGap = textStr !== '' || isEditing
    const textWidth = Math.max(60, textStr.length * 8 + 16)

    const sloppiness = Number(layer.data.sloppiness ?? 0)
    const filterId = sloppiness === 1 ? `url(#hand-drawn-artist-${layer.id})` :
                     sloppiness === 2 ? `url(#hand-drawn-cartoon-${layer.id})` : undefined

    const arrowhead = String(layer.data.arrowhead ?? 'arrow')
    const showArrowhead = arrowhead !== 'none'

    // Compute midpoint coordinate for label typography positioning
    const middleX = bendType === 'curved' ? (relX1 + 2 * relCx + relX2) / 4 : relCx
    const middleY = bendType === 'curved' ? (relY1 + 2 * relCy + relY2) / 4 : relCy
    
    if (mode === 'present' && anim) {
      const progress = frame?.progress ?? 0
      
      strokeDasharray = `${totalLength}`
      if (!isExit) {
        // Entrance animation
        if (direction === 'forward') {
          strokeDashoffset = totalLength * (1 - progress)
          // Scale head from 0 to 1 at the end (last 30% of progress)
          headScale = progress < 0.7 ? 0 : (progress - 0.7) / 0.3
        } else {
          // Backward
          strokeDashoffset = -totalLength * (1 - progress)
          // Scale head immediately at start (first 30% of progress)
          headScale = Math.min(1, progress / 0.3)
        }
      } else {
        // Exit animation
        if (direction === 'forward') {
          strokeDashoffset = totalLength * progress
          // Head scales down immediately (first 30% of progress)
          headScale = Math.max(0, 1 - progress / 0.3)
        } else {
          // Backward
          strokeDashoffset = -totalLength * progress
          // Head scales down at the end (last 30% of progress)
          headScale = progress > 0.7 ? 0 : (0.7 - progress) / 0.7
        }
      }
    }
    
    // CSS-based preview class handling
    const isPreview = anim && mode === 'editor' && typeof window !== 'undefined' && 
      (window as any)._previewingArrowId === layer.id
      
    const animClass = isPreview
      ? `animate-draw-${isExit ? 'exit-' : ''}${direction}`
      : ''
      
    const easingCss = easing === 'linear' ? 'linear' :
                     easing === 'easeIn' ? 'ease-in' :
                     easing === 'easeOut' ? 'ease-out' :
                     easing === 'easeInOut' ? 'ease-in-out' : 'ease-out'
                     
    const styleVariables: React.CSSProperties = isPreview ? {
      '--arrow-length': `${totalLength}px`,
      '--duration': `${duration}ms`,
      '--delay': `${delay}ms`,
      '--easing': easingCss,
    } as any : {}

    return (
      <div className="relative w-full h-full" style={styleVariables}>
        {isPreview && (
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes draw-forward-kf {
              from { stroke-dashoffset: var(--arrow-length); }
              to { stroke-dashoffset: 0; }
            }
            @keyframes draw-backward-kf {
              from { stroke-dashoffset: calc(-1 * var(--arrow-length)); }
              to { stroke-dashoffset: 0; }
            }
            @keyframes draw-exit-forward-kf {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: var(--arrow-length); }
            }
            @keyframes draw-exit-backward-kf {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: calc(-1 * var(--arrow-length)); }
            }
            @keyframes draw-head-enter-kf {
              0%, 70% { transform: scale(0); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes draw-head-enter-backward-kf {
              0% { transform: scale(0); opacity: 0; }
              30%, 100% { transform: scale(1); opacity: 1; }
            }
            @keyframes draw-head-exit-kf {
              0%, 30% { transform: scale(1); opacity: 1; }
              100% { transform: scale(0); opacity: 0; }
            }
            @keyframes draw-head-exit-backward-kf {
              0% { transform: scale(1); opacity: 1; }
              70%, 100% { transform: scale(0); opacity: 0; }
            }
            
            .animate-draw-forward path {
              stroke-dasharray: var(--arrow-length);
              stroke-dashoffset: var(--arrow-length);
              animation: draw-forward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            .animate-draw-forward polygon {
              transform-origin: right center;
              animation: draw-head-enter-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            
            .animate-draw-backward path {
              stroke-dasharray: var(--arrow-length);
              stroke-dashoffset: calc(-1 * var(--arrow-length));
              animation: draw-backward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            .animate-draw-backward polygon {
              transform-origin: right center;
              animation: draw-head-enter-backward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            
            .animate-draw-exit-forward path {
              stroke-dasharray: var(--arrow-length);
              stroke-dashoffset: 0;
              animation: draw-exit-forward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            .animate-draw-exit-forward polygon {
              transform-origin: right center;
              animation: draw-head-exit-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            
            .animate-draw-exit-backward path {
              stroke-dasharray: var(--arrow-length);
              stroke-dashoffset: 0;
              animation: draw-exit-backward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
            .animate-draw-exit-backward polygon {
              transform-origin: right center;
              animation: draw-head-exit-backward-kf var(--duration) var(--easing) var(--delay) forwards;
            }
          `}} />
        )}
        <svg width="100%" height="100%" style={{ overflow: 'visible' }} className={animClass}>
          <defs>
            {/* Unified mask for solid line (contains overlap cuts and text gap cut) */}
            <mask id={maskId}>
              <rect x="-5000" y="-5000" width="10000" height="10000" fill="white" />
              {hasGap && (
                <rect
                  x={middleX - textWidth / 2}
                  y={middleY - 12}
                  width={textWidth}
                  height={24}
                  fill="black"
                  rx="4"
                />
              )}
              {hasOverlap && otherLayers.map((ol) => {
                const localX = ol.transform.x - layer.transform.x
                const localY = ol.transform.y - layer.transform.y
                return (
                  <rect
                    key={ol.id}
                    x={localX}
                    y={localY}
                    width={ol.transform.width}
                    height={ol.transform.height}
                    fill="black"
                  />
                )
              })}
            </mask>

            {/* Dotted mask (only shows inside overlapping elements and NOT in the text gap) */}
            <mask id={dottedMaskId}>
              <rect x="-5000" y="-5000" width="10000" height="10000" fill="black" />
              {hasOverlap && otherLayers.map((ol) => {
                const localX = ol.transform.x - layer.transform.x
                const localY = ol.transform.y - layer.transform.y
                return (
                  <rect
                    key={ol.id}
                    x={localX}
                    y={localY}
                    width={ol.transform.width}
                    height={ol.transform.height}
                    fill="white"
                  />
                )
              })}
              {hasGap && (
                <rect
                  x={middleX - textWidth / 2}
                  y={middleY - 12}
                  width={textWidth}
                  height={24}
                  fill="black"
                  rx="4"
                />
              )}
            </mask>

            {/* Hand-drawn sloppiness filters */}
            <filter id={`hand-drawn-artist-${layer.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id={`hand-drawn-cartoon-${layer.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Invisible wide stroke for easy pointer hit testing */}
          <path
            d={pathD}
            stroke="transparent"
            strokeWidth={Math.max(24, sw + 16)}
            fill="none"
            filter={filterId}
            style={{ cursor: 'move', pointerEvents: 'stroke' }}
          />

          {/* Solid/Normal stroke (cut out inside elements and text gap) */}
          <path
            d={pathD}
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            mask={`url(#${maskId})`}
            filter={filterId}
            style={{ pointerEvents: 'none' }}
          />

          {/* Overlapping stroke (only visible inside elements if hasOverlap is true) */}
          {hasOverlap && (
            <path
              d={pathD}
              stroke={c}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={intersectStyle === 'dotted' ? '2, 6' : '8, 8'}
              strokeDashoffset={strokeDashoffset}
              mask={`url(#${dottedMaskId})`}
              filter={filterId}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {showArrowhead && (
            <polygon
              points={`${relX2 - 16},${relY2 - 9} ${relX2},${relY2} ${relX2 - 16},${relY2 + 9}`}
              fill={c}
              filter={filterId}
              style={{
                transform: `rotate(${angleDeg}deg) scale(${headScale})`,
                transformOrigin: `${relX2}px ${relY2}px`,
                transition: isPreview ? undefined : 'transform 50ms linear',
                pointerEvents: 'none',
              }}
            />
          )}
        </svg>

        {textStr !== '' && !isEditing && (
          <div
            style={{
              position: 'absolute',
              left: `${bendType === 'curved' ? middleX : relCx}px`,
              top: `${bendType === 'curved' ? middleY : relCy}px`,
              transform: 'translate(-50%, -50%)',
              color: c,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontFamily: 'var(--font-sans), system-ui, sans-serif',
              textShadow: '0 1px 2px rgba(255, 255, 255, 0.9), 0 0 4px rgba(255, 255, 255, 0.9)',
            }}
          >
            {textStr}
          </div>
        )}
      </div>
    )
  }
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
  
  const has3D = d.perspective !== undefined || d.rotateX !== undefined || d.rotateY !== undefined || d.rotateZ !== undefined || d.translateZ !== undefined
  if (has3D) {
    const p = d.perspective !== undefined ? Number(d.perspective) : 0
    const rx = d.rotateX !== undefined ? Number(d.rotateX) : 0
    const ry = d.rotateY !== undefined ? Number(d.rotateY) : 0
    const rz = d.rotateZ !== undefined ? Number(d.rotateZ) : 0
    const tz = d.translateZ !== undefined ? Number(d.translateZ) : 0
    
    let transform3d = ''
    if (p > 0) transform3d += `perspective(${p}px) `
    if (rx !== 0) transform3d += `rotateX(${rx}deg) `
    if (ry !== 0) transform3d += `rotateY(${ry}deg) `
    if (rz !== 0) transform3d += `rotateZ(${rz}deg) `
    if (tz !== 0) transform3d += `translateZ(${tz}px) `
    
    if (transform3d.trim()) parts.push(transform3d.trim())
  } else if (typeof d.transform === 'string' && d.transform.trim()) {
    parts.push(d.transform.trim())
  }
  
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
