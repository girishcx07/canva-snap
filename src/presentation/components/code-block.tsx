'use client'

// Code presentation component with a window chrome (mac-style dots, centered
// title, optional VSCode-style file tabs) and three body modes:
//  - present: clipped reveal window that scrolls via the morph engine
//  - editor (unselected): full highlighted code + a viewable-range band
//  - editor (selected, single file): highlighted editing — a transparent
//    textarea overlays the shiki-highlighted code so tokens stay visible.

import { useEffect, useRef, useState } from 'react'

import { highlightCode, type HighlightedCode } from '@/lib/code-highlighter'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'

export type CodeFile = { name: string; code: string; language: string }

export type CodeBlockData = {
  code: string
  language: string
  title?: string
  showLineNumbers?: boolean
  visibleRange?: [number, number]
  // focusLines: dim everything else. highlightLines: background highlight only.
  focusLines?: number[]
  highlightLines?: number[]
  diff?: { added?: number[]; removed?: number[] }
  fontSize?: number
  // Presentation reveal of the code on slide enter.
  reveal?: 'none' | 'typing' | 'lines'
  // Optional multi-file window (VSCode-style tabs). When present, the active
  // file is shown; `activeFile` drives file-switching during a presentation.
  files?: CodeFile[]
  activeFile?: number
}

export function CodeBlock({
  data,
  className,
  mode = 'present',
  interactive = false,
  onChange,
}: {
  data: CodeBlockData
  className?: string
  mode?: 'editor' | 'present'
  interactive?: boolean
  onChange?: (code: string) => void
}) {
  const { codeTheme } = useTheme()
  const [hl, setHl] = useState<HighlightedCode | null>(null)
  const [tab, setTab] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const files = data.files
  const active = data.activeFile ?? tab
  const file: CodeFile = files?.[active] ?? {
    name: data.title ?? 'main',
    code: data.code,
    language: data.language,
  }
  const editable = mode === 'editor' && interactive && !files

  const typing = mode === 'present' && data.reveal === 'typing'
  const lineReveal = mode === 'present' && data.reveal === 'lines'
  const [revealed, setRevealed] = useState(1e9)

  // Reveal animation on enter (typing = chars, lines = line count).
  useEffect(() => {
    if (!typing && !lineReveal) return setRevealed(1e9)
    setRevealed(0)
    const total = typing ? file.code.length : file.code.split('\n').length
    const stepN = typing ? 2 : 1
    const ms = typing ? 18 : 200
    const id = setInterval(() => {
      setRevealed((r) => {
        const n = r + stepN
        if (n >= total) {
          clearInterval(id)
          return 1e9
        }
        return n
      })
    }, ms)
    return () => clearInterval(id)
  }, [typing, lineReveal, file.code])

  const displayCode = typing ? file.code.slice(0, revealed) : file.code

  useEffect(() => {
    let on = true
    highlightCode({ code: displayCode, language: file.language, theme: codeTheme }).then(
      (r) => on && setHl(r),
    )
    return () => {
      on = false
    }
  }, [displayCode, file.language, codeTheme])

  const fontSize = data.fontSize ?? 16
  const lineHeight = Math.round(fontSize * 1.6)
  const lines = hl?.lines ?? file.code.split('\n').map(() => [])
  const added = new Set(data.diff?.added ?? [])
  const removed = new Set(data.diff?.removed ?? [])
  const highlighted = new Set(data.highlightLines ?? [])
  const focus = data.focusLines && data.focusLines.length > 0
  const [start, end] = data.visibleRange ?? [1, lines.length]
  const editor = mode === 'editor'

  useEffect(() => {
    if (editor && interactive && scrollRef.current) {
      scrollRef.current.scrollTop = (start - 1) * lineHeight
    }
  }, [editor, interactive, start, lineHeight])

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
    fontSize,
    lineHeight: `${lineHeight}px`,
  }

  const line = (tokens: HighlightedCode['lines'][number], i: number) => {
    const n = i + 1
    const dimmed = !editor && focus && !data.focusLines!.includes(n)
    const hidden = lineReveal && n > revealed
    const isAdded = added.has(n)
    const isRemoved = removed.has(n)
    const isHi = highlighted.has(n)
    return (
      <div
        key={n}
        className="flex whitespace-pre"
        style={{
          height: lineHeight,
          opacity: hidden ? 0 : dimmed ? 0.32 : 1,
          transition: 'opacity 300ms ease',
          boxShadow: isHi ? 'inset 3px 0 0 #f5d90a' : undefined,
          background: isAdded
            ? 'rgba(46,160,67,0.18)'
            : isRemoved
              ? 'rgba(248,81,73,0.18)'
              : isHi
                ? 'rgba(245,217,10,0.14)'
                : undefined,
        }}
      >
        {data.showLineNumbers !== false && (
          <span className="mr-4 inline-block w-8 shrink-0 select-none text-right opacity-40">
            {isAdded ? '+' : isRemoved ? '-' : n}
          </span>
        )}
        <span>
          {tokens.length === 0
            ? '\u00a0'
            : tokens.map((t, ti) => (
                <span key={ti} style={{ color: t.color, fontStyle: t.fontStyle === 1 ? 'italic' : undefined }}>
                  {t.content}
                </span>
              ))}
        </span>
      </div>
    )
  }

  // Window chrome -----------------------------------------------------------
  const chrome = (body: React.ReactNode) => (
    <div
      className={cn('flex flex-col overflow-hidden rounded-xl border border-black/10 shadow-lg', className)}
      style={{ background: hl?.background ?? 'var(--card)', color: hl?.foreground, height: '100%' }}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        {files && files.length > 0 ? (
          <div className="ml-3 flex items-end gap-1 overflow-x-auto text-xs">
            {files.map((f, i) => (
              <button
                key={f.name + i}
                onClick={() => setTab(i)}
                className={cn(
                  'rounded-t-md px-2.5 py-1 whitespace-nowrap',
                  i === active ? 'bg-white/15 font-medium' : 'opacity-60 hover:opacity-100',
                )}
              >
                {f.name}
              </button>
            ))}
          </div>
        ) : (
          <span className="absolute left-1/2 -translate-x-1/2 text-xs opacity-70">
            {data.title ?? file.language}
          </span>
        )}
      </div>
      <div className="relative min-h-0 flex-1">{body}</div>
    </div>
  )

  // Editing: a visible, themed textarea (reliable typing/paste). Token
  // highlighting returns the moment the element is deselected / presented.
  if (editable) {
    return chrome(
      <textarea
        autoFocus
        spellCheck={false}
        value={file.code}
        onChange={(e) => onChange?.(e.target.value)}
        onPaste={(e) => {
          e.stopPropagation()
          const text = e.clipboardData.getData('text')
          const el = e.currentTarget
          const next = file.code.slice(0, el.selectionStart) + text + file.code.slice(el.selectionEnd)
          e.preventDefault()
          onChange?.(next)
        }}
        className="h-full w-full resize-none overflow-auto whitespace-pre p-3 outline-none"
        style={{
          ...codeStyle,
          background: hl?.background ?? 'var(--card)',
          color: hl?.foreground ?? '#e5e7eb',
          caretColor: hl?.foreground ?? '#e5e7eb',
          border: 'none',
        }}
      />,
    )
  }

  // Editor (full code + viewable band) --------------------------------------
  if (editor) {
    const bandTop = (start - 1) * lineHeight
    const bandHeight = (end - start + 1) * lineHeight
    return chrome(
      <div ref={scrollRef} className="h-full overflow-auto px-4 py-3" style={codeStyle}>
        <div className="relative">
          {data.visibleRange && (
            <div
              className="pointer-events-none absolute right-0 left-0 rounded border-l-2 border-sky-500 bg-sky-500/10"
              style={{ top: bandTop, height: bandHeight }}
            />
          )}
          {lines.map(line)}
        </div>
      </div>,
    )
  }

  // Present (clipped reveal window) -----------------------------------------
  return chrome(
    <div className="h-full overflow-hidden px-4 py-3" style={codeStyle}>
      <div style={{ transform: `translateY(${-(start - 1) * lineHeight}px)`, willChange: 'transform' }}>
        {lines.map(line)}
      </div>
    </div>,
  )
}
