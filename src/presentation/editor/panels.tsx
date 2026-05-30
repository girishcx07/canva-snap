'use client'

// Secondary-panel contents for the Canva-style sidebar. Asset libraries are
// external and keyless: Iconify (icons) and Openverse (images). Results are
// cached per query; clicking inserts a centered layer on the current slide.

import { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'

import { createCenteredLayer } from '../registry'
import type { EditorStore } from '../store'

type PanelProps = { store: EditorStore }

function insert(
  store: EditorStore,
  type: string,
  patch?: Parameters<typeof createCenteredLayer>[2],
) {
  const layer = createCenteredLayer(type, store.getState().project, patch)
  if (layer) store.addLayer(layer)
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted"
    >
      {label}
    </button>
  )
}

export function TextPanel({ store }: PanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <AddButton
        label="Add a heading"
        onClick={() => insert(store, 'heading', { data: { text: 'Heading' } })}
      />
      <AddButton
        label="Add a subheading"
        onClick={() =>
          insert(store, 'heading', {
            data: { text: 'Subheading' },
            style: { fontSize: 32, fontWeight: 600 },
          })
        }
      />
      <AddButton
        label="Add body text"
        onClick={() => insert(store, 'text', { data: { text: 'Body text' } })}
      />
    </div>
  )
}

export function CodePanel({ store }: PanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <AddButton label="Code block" onClick={() => insert(store, 'code')} />
      <p className="text-xs text-muted-foreground">
        Select a code block on the canvas to scroll it and set its visible
        window; the inspector controls language, focus and diff lines.
      </p>
    </div>
  )
}

export function ShapesPanel({ store }: PanelProps) {
  const shapes = [
    { label: 'Rectangle', shape: 'rect' },
    { label: 'Ellipse', shape: 'ellipse' },
    { label: 'Pill', shape: 'pill' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {shapes.map((s) => (
        <button
          key={s.shape}
          title={s.label}
          onClick={() => insert(store, 'shape', { data: { shape: s.shape } })}
          className="flex aspect-square items-center justify-center rounded-lg border hover:bg-muted"
        >
          <span
            className="size-8 bg-foreground/70"
            style={{ borderRadius: s.shape === 'ellipse' ? '50%' : s.shape === 'pill' ? 9999 : 6 }}
          />
        </button>
      ))}
    </div>
  )
}

export function TemplatesPanel() {
  return (
    <p className="px-1 text-sm text-muted-foreground">
      Template gallery coming soon. Start from a blank slide and save your own
      as templates.
    </p>
  )
}

// --- Iconify (icons) -------------------------------------------------------

const iconCache = new Map<string, string[]>()

export function IconsPanel({ store }: PanelProps) {
  const [q, setQ] = useState('arrow')
  const [icons, setIcons] = useState<string[]>([])

  useEffect(() => {
    const query = q.trim()
    if (!query) return setIcons([])
    if (iconCache.has(query)) return setIcons(iconCache.get(query)!)
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=72`,
        )
        const j = (await r.json()) as { icons?: string[] }
        iconCache.set(query, j.icons ?? [])
        setIcons(j.icons ?? [])
      } catch {
        setIcons([])
      }
    }, 300)
    return () => clearTimeout(id)
  }, [q])

  async function add(name: string) {
    try {
      const svg = await (
        await fetch(`https://api.iconify.design/${name.replace(':', '/')}.svg`)
      ).text()
      insert(store, 'svg', { data: { markup: svg }, transform: { width: 120, height: 120 } })
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search icons" />
      <div className="grid grid-cols-5 gap-1 overflow-auto">
        {icons.map((name) => (
          <button
            key={name}
            title={name}
            onClick={() => add(name)}
            className="grid aspect-square place-items-center rounded-md border bg-muted/40 p-1.5 hover:bg-muted"
          >
            <img
              src={`https://api.iconify.design/${name.replace(':', '/')}.svg`}
              alt=""
              loading="lazy"
              className="size-full dark:invert"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Openverse (images) ----------------------------------------------------

type OpenverseImage = { id: string; url: string; thumbnail?: string; title?: string }
const imageCache = new Map<string, OpenverseImage[]>()

export function ImagesPanel({ store }: PanelProps) {
  const [q, setQ] = useState('mountains')
  const [imgs, setImgs] = useState<OpenverseImage[]>([])

  useEffect(() => {
    const query = q.trim()
    if (!query) return setImgs([])
    if (imageCache.has(query)) return setImgs(imageCache.get(query)!)
    const id = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=30`,
        )
        const j = (await r.json()) as { results?: OpenverseImage[] }
        imageCache.set(query, j.results ?? [])
        setImgs(j.results ?? [])
      } catch {
        setImgs([])
      }
    }, 350)
    return () => clearTimeout(id)
  }, [q])

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <SearchField value={q} onChange={setQ} placeholder="Search images" />
      <div className="grid grid-cols-2 gap-1.5 overflow-auto">
        {imgs.map((img) => (
          <button
            key={img.id}
            title={img.title}
            onClick={() =>
              insert(store, 'image', {
                data: { src: img.url, alt: img.title ?? '' },
                transform: { width: 360, height: 240 },
              })
            }
            className="overflow-hidden rounded-md border hover:opacity-90"
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
  )
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
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
  )
}
