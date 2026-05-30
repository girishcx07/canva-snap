'use client'

// Code presentation component. Reuses the repo's shiki highlighter.
// - present mode: clips to the `visibleRange` window and translates so the
//   range animates (smooth scroll) when it changes between slides.
// - editor mode: shows the full code; when the layer is selected it becomes
//   scrollable so the author can move up/down, and the viewable window
//   (`visibleRange`) is drawn as a highlighted band so it is clear which lines
//   will be shown when presenting.

import { useEffect, useRef, useState } from 'react'

import { highlightCode, type HighlightedCode } from '@/lib/code-highlighter'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'

export type CodeBlockData = {
  code: string
  language: string
  showLineNumbers?: boolean
  // 1-based inclusive [start, end] window of lines to reveal/scroll to.
  visibleRange?: [number, number]
  // 1-based lines kept bright; everything else is dimmed (focus mode).
  focusLines?: number[]
  // 1-based lines marked as added / removed (diff mode).
  diff?: { added?: number[]; removed?: number[] }
  fontSize?: number
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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    highlightCode({ code: data.code, language: data.language, theme: codeTheme }).then(
      (result) => active && setHl(result),
    )
    return () => {
      active = false
    }
  }, [data.code, data.language, codeTheme])

  const fontSize = data.fontSize ?? 16
  const lineHeight = Math.round(fontSize * 1.6)
  const lines = hl?.lines ?? data.code.split('\n').map(() => [])
  const added = new Set(data.diff?.added ?? [])
  const removed = new Set(data.diff?.removed ?? [])
  const focus = data.focusLines && data.focusLines.length > 0
  const [start, end] = data.visibleRange ?? [1, lines.length]
  const editor = mode === 'editor'

  // When entering edit, scroll so the viewable band is in view.
  useEffect(() => {
    if (editor && interactive && scrollRef.current) {
      scrollRef.current.scrollTop = (start - 1) * lineHeight
    }
  }, [editor, interactive, start, lineHeight])

  const line = (tokens: HighlightedCode['lines'][number], i: number) => {
    const lineNo = i + 1
    const dimmed = !editor && focus && !data.focusLines!.includes(lineNo)
    const isAdded = added.has(lineNo)
    const isRemoved = removed.has(lineNo)
    return (
      <div
        key={lineNo}
        className="flex whitespace-pre"
        style={{
          height: lineHeight,
          opacity: dimmed ? 0.32 : 1,
          transition: 'opacity 400ms ease',
          background: isAdded
            ? 'rgba(46, 160, 67, 0.18)'
            : isRemoved
              ? 'rgba(248, 81, 73, 0.18)'
              : undefined,
        }}
      >
        {data.showLineNumbers !== false && (
          <span
            className="mr-4 inline-block shrink-0 select-none text-right opacity-40"
            style={{ width: '2.5em' }}
          >
            {isAdded ? '+' : isRemoved ? '-' : lineNo}
          </span>
        )}
        <span>
          {tokens.length === 0
            ? '\u00a0'
            : tokens.map((token, ti) => (
                <span
                  key={ti}
                  style={{
                    color: token.color,
                    fontStyle: token.fontStyle === 1 ? 'italic' : undefined,
                  }}
                >
                  {token.content}
                </span>
              ))}
        </span>
      </div>
    )
  }

  // --- Editor: full code, scrollable when selected, with viewable band -------
  if (editor) {
    const bandTop = (start - 1) * lineHeight
    const bandHeight = (end - start + 1) * lineHeight

    // When selected, edit/paste code directly in the block.
    if (interactive && onChange) {
      return (
        <textarea
          spellCheck={false}
          value={data.code}
          onChange={(e) => onChange(e.target.value)}
          className={cn('resize-none rounded-xl font-mono outline-none', className)}
          style={{
            background: hl?.background ?? 'var(--card)',
            color: hl?.foreground ?? 'inherit',
            fontSize,
            lineHeight: `${lineHeight}px`,
            height: '100%',
            width: '100%',
            padding: '12px 16px',
            border: 'none',
            whiteSpace: 'pre',
          }}
        />
      )
    }

    return (
      <div
        ref={scrollRef}
        className={cn('relative rounded-xl font-mono', className)}
        style={{
          background: hl?.background ?? 'var(--card)',
          color: hl?.foreground,
          fontSize,
          lineHeight: `${lineHeight}px`,
          height: '100%',
          padding: '12px 16px',
          overflowY: interactive ? 'auto' : 'hidden',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      >
        <div className="relative">
          {data.visibleRange && (
            <div
              className="pointer-events-none absolute right-0 left-0 rounded border-l-2 border-primary bg-primary/10"
              style={{ top: bandTop, height: bandHeight }}
            />
          )}
          {lines.map(line)}
        </div>
      </div>
    )
  }

  // --- Present: clipped reveal window with smooth scroll ---------------------
  const windowHeight = (end - start + 1) * lineHeight
  const hasWindow = Boolean(data.visibleRange)
  return (
    <div
      className={cn('overflow-hidden rounded-xl font-mono', className)}
      style={{
        background: hl?.background ?? 'var(--card)',
        color: hl?.foreground,
        fontSize,
        lineHeight: `${lineHeight}px`,
        height: hasWindow ? windowHeight + 24 : '100%',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          transform: `translateY(${-(start - 1) * lineHeight}px)`,
          willChange: 'transform',
        }}
      >
        {lines.map(line)}
      </div>
    </div>
  )
}
