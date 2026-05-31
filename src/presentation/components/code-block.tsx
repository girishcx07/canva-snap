'use client'

// Code presentation component — full Snappify feature parity.
//
// Three render modes:
//  - present: clipped reveal window driven by the morph/player engine
//  - editor (unselected): full highlighted code + visible-range band
//  - editor (selected, single file): contenteditable textarea overlay
//
// Phase 1 features (styling):
//   per-block theme, editor background, border, window chrome toggle,
//   accent color, font family/ligatures, line number start, tab size,
//   highlight opacity, highlight filter (blur/gray-out), CSS filters,
//   box-shadow, multi-file tabs
//
// Phase 2 features (animation):
//   Code-change transitions: fadeIn / smooth / typewriter / lineByLine
//   Configurable revealSpeed + revealDelay for typewriter mode
//   Filename tab with file-type icons, + button in editor mode

import { useCallback, useEffect, useRef, useState } from 'react'

import { highlightCode, type CodeTheme, type HighlightedCode } from '@/lib/code-highlighter'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'
import type { EasingName } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CodeFile = { name: string; code: string; language: string }

export type HighlightOpacity = 25 | 50 | 75 | 100
export type HighlightFilter = 'none' | 'blur' | 'grayout'

/** How to animate the code content when transitioning between slides */
export type CodeAnimationType = 'none' | 'fadeIn' | 'smooth' | 'typewriter' | 'lineByLine'

export type CodeAnimationConfig = {
  type: CodeAnimationType
  durationMs?: number    // default 600
  delayMs?: number       // default 0
  easing?: EasingName    // default 'easeOut'
}

export type CodeBlockData = {
  // Core content
  code: string
  language: string
  title?: string

  // Line numbers
  showLineNumbers?: boolean
  lineNumberStart?: number           // Starting line number (default 1)

  // Reveal animation (entry, within a slide)
  reveal?: 'none' | 'typing' | 'lines'
  revealSpeed?: number               // chars/second for typing mode (default 40)
  revealDelay?: number               // ms before reveal starts (default 0)

  // Scrollable window / visible region
  visibleRange?: [number, number]

  // Code-change transition (cross-slide)
  codeAnimation?: CodeAnimationConfig

  // Line highlighting
  focusLines?: number[]              // Dim all other lines
  highlightLines?: number[]          // Tint chosen lines
  highlightOpacity?: HighlightOpacity  // Opacity of dimmed lines (25/50/75/100)
  highlightFilter?: HighlightFilter    // Extra CSS filter on dimmed lines

  // Diff coloring
  diff?: { added?: number[]; removed?: number[] }

  // Typography
  fontSize?: number
  fontFamily?: string
  ligatures?: boolean
  tabSize?: 2 | 3 | 4 | 6

  // Window chrome
  showWindowChrome?: boolean         // default true
  showAccentColor?: boolean          // default true
  accentColor?: string               // override the red/yellow/green dots

  // Editor background (overrides theme bg; supports gradients & rgba)
  editorBackground?: string

  // Border on the outer chrome frame
  borderColor?: string
  borderWidth?: number

  // Per-block theme override
  theme?: CodeTheme

  // Advanced CSS filters applied to the whole block
  editorBlur?: number                // blur in px
  grayscale?: number                 // 0–100
  sepia?: number                     // 0–100
  hueRotation?: number               // 0–360 degrees
  boxShadow?: string

  // Multi-file window (VSCode-style tabs)
  files?: CodeFile[]
  activeFile?: number
}



function getThemeDefaults(theme: CodeTheme): { bg: string; fg: string; isLight: boolean } {
  switch (theme) {
    case 'github-light':
      return { bg: '#ffffff', fg: '#24292e', isLight: true }
    case 'solarized-light':
      return { bg: '#fdf6e3', fg: '#586e75', isLight: true }
    case 'dracula':
      return { bg: '#282a36', fg: '#f8f8f2', isLight: false }
    case 'nord':
      return { bg: '#2e3440', fg: '#d8dee9', isLight: false }
    case 'one-dark-pro':
      return { bg: '#282c34', fg: '#abb2bf', isLight: false }
    case 'monokai':
      return { bg: '#272822', fg: '#f8f8f2', isLight: false }
    case 'solarized-dark':
      return { bg: '#002b36', fg: '#839496', isLight: false }
    case 'github-dark':
    default:
      return { bg: '#24292e', fg: '#e1e4e8', isLight: false }
  }
}

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

function buildFilter(data: CodeBlockData): string | undefined {
  const parts: string[] = []
  if (data.editorBlur) parts.push(`blur(${data.editorBlur}px)`)
  if (data.grayscale) parts.push(`grayscale(${data.grayscale}%)`)
  if (data.sepia) parts.push(`sepia(${data.sepia}%)`)
  if (data.hueRotation) parts.push(`hue-rotate(${data.hueRotation}deg)`)
  return parts.length > 0 ? parts.join(' ') : undefined
}

/** Opacity for a dimmed (non-focus) line */
export function dimOpacity(highlightOpacity: HighlightOpacity = 100): number {
  return highlightOpacity / 100
}

/** CSS filter string for a dimmed line */
export function dimFilter(highlightFilter: HighlightFilter = 'none'): string | undefined {
  if (highlightFilter === 'blur') return 'blur(3px)'
  if (highlightFilter === 'grayout') return 'grayscale(100%) opacity(0.4)'
  return undefined
}

// ---------------------------------------------------------------------------
// Code-change animation helpers (pure — testable)
// ---------------------------------------------------------------------------

/**
 * For "lineByLine" animation: how many lines of toCode are visible at progress p (0→1).
 */
export function lineByLineCount(totalLines: number, progress: number): number {
  return Math.floor(totalLines * Math.min(1, Math.max(0, progress)))
}

/**
 * For "typewriter" animation: how many chars of toCode are visible at progress p (0→1).
 */
export function typewriterChars(totalChars: number, progress: number): number {
  return Math.floor(totalChars * Math.min(1, Math.max(0, progress)))
}

/**
 * For "fadeIn" animation: compute per-line opacity given whether the line
 * is "new" (added), "old" (removed), or "unchanged" at progress p (0→1).
 */
export function fadeInLineOpacity(
  lineType: 'added' | 'removed' | 'unchanged',
  progress: number,
): number {
  const p = Math.min(1, Math.max(0, progress))
  if (lineType === 'added') return p
  if (lineType === 'removed') return 1 - p
  return 1
}

// ---------------------------------------------------------------------------
// Simple line-diff: classify each line as added / removed / unchanged
// Aligns lines by content (LCS-simplified: just compares sets for now)
// ---------------------------------------------------------------------------

export type LineDiff = ('added' | 'removed' | 'unchanged')[]

export function computeLineDiff(fromCode: string, toCode: string): LineDiff {
  const fromLines = fromCode.split('\n')
  const toLines = toCode.split('\n')
  const fromSet = new Set(fromLines)
  return toLines.map((l) => (fromSet.has(l) ? 'unchanged' : 'added'))
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CodeBlock({
  data,
  className,
  mode = 'present',
  interactive = false,
  onChange,
  onChangeTitle,
  onAddFile,
  onRemoveFile,
  onChangeRange,
  onChangeActiveFile,
  // Code-change animation props (passed by the player)
  fromCode,
  animProgress,
}: {
  data: CodeBlockData
  className?: string
  mode?: 'editor' | 'present'
  interactive?: boolean
  onChange?: (code: string) => void
  onChangeTitle?: (title: string) => void
  onAddFile?: () => void
  onRemoveFile?: (index: number) => void
  /** Called when the user drags to pan the visible range in editor mode */
  onChangeRange?: (range: [number, number]) => void
  onChangeActiveFile?: (index: number) => void
  /** The code this block had on the previous slide (for cross-slide transitions) */
  fromCode?: string
  /** 0→1 progress of the code-change animation */
  animProgress?: number
}) {
  const { codeTheme: globalTheme } = useTheme()
  const codeTheme: CodeTheme = data.theme ?? globalTheme

  const [hl, setHl] = useState<HighlightedCode | null>(null)
  const [tab, setTab] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const highlightScrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const files = data.files
  const active = data.activeFile ?? tab
  const visibleFiles: CodeFile[] = files && files.length > 0
    ? files
    : [{
        name: data.title ?? 'main.ts',
        code: data.code,
        language: data.language,
      }]
  const file = visibleFiles[active] ?? visibleFiles[0]
  const editable = mode === 'editor' && interactive

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightScrollRef.current) {
      highlightScrollRef.current.scrollTop = textareaRef.current.scrollTop
      highlightScrollRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && editable) {
      textarea.addEventListener('scroll', syncScroll)
      syncScroll()
      return () => {
        textarea.removeEventListener('scroll', syncScroll)
      }
    }
  }, [syncScroll, editable, file.code])

  useEffect(() => {
    if (data.activeFile !== undefined && data.activeFile !== tab) {
      setTab(data.activeFile)
    }
  }, [data.activeFile, tab])

  useEffect(() => {
    if (editable && textareaRef.current) {
      const activeEl = document.activeElement
      if (activeEl && activeEl !== textareaRef.current && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return
      }
      if (activeEl !== textareaRef.current) {
        const startPos = textareaRef.current.selectionStart
        const endPos = textareaRef.current.selectionEnd
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(startPos, endPos)
      }
    }
  })

  // --- Entry reveal animation (within a slide) ---
  const typing = mode === 'present' && data.reveal === 'typing'
  const lineReveal = mode === 'present' && data.reveal === 'lines'
  const [revealed, setRevealed] = useState(1e9)

  useEffect(() => {
    if (!typing && !lineReveal) return setRevealed(1e9)
    const delay = data.revealDelay ?? 0
    const speed = data.revealSpeed ?? 40 // chars per second
    let timeout: ReturnType<typeof setTimeout>
    let id: ReturnType<typeof setInterval>

    timeout = setTimeout(() => {
      setRevealed(0)
      const total = typing ? file.code.length : file.code.split('\n').length
      // For typing: interval = 1000/speed ms per char, step = 1
      // For lines: 200ms per line
      const ms = typing ? Math.max(8, 1000 / speed) : 200
      const stepN = 1
      id = setInterval(() => {
        setRevealed((r) => {
          const n = r + stepN
          if (n >= total) {
            clearInterval(id)
            return 1e9
          }
          return n
        })
      }, ms)
    }, delay)

    return () => {
      clearTimeout(timeout)
      clearInterval(id)
    }
  }, [typing, lineReveal, file.code, data.revealDelay, data.revealSpeed])

  // --- Code being displayed (entry reveal splice) ---
  const displayCode = typing ? file.code.slice(0, revealed) : file.code

  // --- Highlight via Shiki ---
  useEffect(() => {
    let on = true
    highlightCode({ code: displayCode, language: file.language, theme: codeTheme }).then(
      (r) => on && setHl(r),
    )
    return () => { on = false }
  }, [displayCode, file.language, codeTheme])

  // --- Layout constants ---
  const fontSize = data.fontSize ?? 16
  const lineHeight = Math.round(fontSize * 1.6)
  const tabSize = data.tabSize ?? 2
  const lineNumberStart = data.lineNumberStart ?? 1
  const showWindowChrome = data.showWindowChrome !== false
  const showAccentColor = data.showAccentColor !== false
  const hlOpacity = data.highlightOpacity ?? 100
  const hlFilter = data.highlightFilter ?? 'none'

  const lines = hl?.lines ?? file.code.split('\n').map(() => [])
  const added = new Set(data.diff?.added ?? [])
  const removed = new Set(data.diff?.removed ?? [])
  const highlighted = new Set(data.highlightLines ?? [])
  const focus = data.focusLines && data.focusLines.length > 0
  const [start, end] = data.visibleRange ?? [1, lines.length]
  const editor = mode === 'editor'

  const { bg: defaultBg, fg: defaultFg, isLight: themeIsLight } = getThemeDefaults(codeTheme)
  const bgColor = hl?.background ?? defaultBg
  const fgColor = hl?.foreground ?? defaultFg

  // ---------------------------------------------------------------------------
  // Drag-to-pan: lets user drag the code content to adjust visibleRange
  // (like repositioning a background image inside a frame)
  // ---------------------------------------------------------------------------
  const panStartY = useRef<number | null>(null)
  const panStartRange = useRef<[number, number]>([start, end])

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (!onChangeRange || interactive) return
    e.preventDefault()
    panStartY.current = e.clientY
    panStartRange.current = [start, end]

    const handleMove = (me: MouseEvent) => {
      if (panStartY.current === null) return
      const deltaY = me.clientY - panStartY.current
      // Convert px delta to lines (negative delta = dragging up = moving window down)
      const lineDelta = -Math.round(deltaY / lineHeight)
      const totalLines = lines.length
      const rangeLen = panStartRange.current[1] - panStartRange.current[0]
      const newStart = Math.max(1, Math.min(panStartRange.current[0] + lineDelta, totalLines - rangeLen))
      const newEnd = newStart + rangeLen
      onChangeRange([newStart, Math.min(newEnd, totalLines)])
    }

    const handleUp = () => {
      panStartY.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [onChangeRange, interactive, start, end, lineHeight, lines.length])

  const isPanMode = editor && !interactive && !!onChangeRange && !!data.visibleRange

  useEffect(() => {
    if (editor && interactive && scrollRef.current) {
      scrollRef.current.scrollTop = (start - 1) * lineHeight
    }
  }, [editor, interactive, start, lineHeight])

  // --- Code-change animation ---
  const animType = data.codeAnimation?.type ?? 'none'
  const hasCodeAnim = mode === 'present' && animType !== 'none' && fromCode !== undefined && animProgress !== undefined
  const lineDiff = hasCodeAnim && animType === 'fadeIn'
    ? computeLineDiff(fromCode!, displayCode)
    : null

  const codeStyle: React.CSSProperties = {
    fontFamily: data.fontFamily ?? 'var(--font-mono, ui-monospace, monospace)',
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeight}px`,
    fontVariantLigatures: data.ligatures ? 'contextual' : 'none',
    tabSize,
    MozTabSize: tabSize,
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    textTransform: 'none',
    textIndent: '0px',
    textShadow: 'none',
    textAlign: 'left',
    margin: 0,
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties

  const outerFilter = buildFilter(data)
  const outerStyle: React.CSSProperties = {
    filter: outerFilter,
    boxShadow: data.boxShadow,
    height: '100%',
    width: '100%',
  }

  // ---------------------------------------------------------------------------
  // Line renderer
  // ---------------------------------------------------------------------------
  const renderLine = (tokens: HighlightedCode['lines'][number], i: number) => {
    const logicalLineNum = i + 1         // 1-based for set lookups
    const displayLineNum = i + lineNumberStart  // For gutter display

    const dimmed = !editor && focus && !data.focusLines!.includes(logicalLineNum)
    const hidden = lineReveal && logicalLineNum > revealed
    const isAdded = added.has(logicalLineNum)
    const isRemoved = removed.has(logicalLineNum)
    const isHi = highlighted.has(logicalLineNum)

    // Compute opacity/filter from highlight system
    let lineOpacity = 1
    let lineFilter: string | undefined = undefined
    if (hidden) {
      lineOpacity = 0
    } else if (dimmed) {
      lineOpacity = dimOpacity(hlOpacity)
      lineFilter = dimFilter(hlFilter)
    }

    // Override with code-change animation opacity (fadeIn type)
    if (hasCodeAnim && animType === 'fadeIn' && lineDiff) {
      const lt = lineDiff[i] ?? 'unchanged'
      lineOpacity *= fadeInLineOpacity(lt, animProgress!)
    }

    // Cross-fade all lines for smooth animation
    if (hasCodeAnim && animType === 'smooth') {
      lineOpacity *= Math.min(1, animProgress! * 2) // fade in new content in first half
    }

    return (
      <div
        key={logicalLineNum}
        className="flex whitespace-pre"
        style={{
          height: lineHeight,
          opacity: lineOpacity,
          filter: lineFilter,
          transition: 'opacity 300ms ease, filter 300ms ease',
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
            {isAdded ? '+' : isRemoved ? '-' : displayLineNum}
          </span>
        )}
        <span>
          {tokens.length === 0
            ? (file.code.split('\n')[i] || '\u00a0')
            : tokens.map((t, ti) => (
                <span key={ti} style={{ color: t.color, fontStyle: t.fontStyle === 1 ? 'italic' : undefined }}>
                  {t.content}
                </span>
              ))}
        </span>
      </div>
    )
  }

  // For typewriter code-change animation: slice code at animProgress chars
  const effectiveLines = (() => {
    if (hasCodeAnim && animType === 'typewriter' && animProgress !== undefined) {
      const charCount = typewriterChars(displayCode.length, animProgress)
      const sliced = displayCode.slice(0, charCount)
      return sliced.split('\n').map(() => [] as HighlightedCode['lines'][number])
    }
    if (hasCodeAnim && animType === 'lineByLine' && animProgress !== undefined) {
      const visibleCount = lineByLineCount(lines.length, animProgress)
      return lines.slice(0, visibleCount)
    }
    return lines
  })()

  // ---------------------------------------------------------------------------
  // Chrome dots
  // ---------------------------------------------------------------------------
  const accentDots = () => {
    if (!showAccentColor) {
      return (
        <>
          <span className="size-3 rounded-full bg-[#6e6e6e]" />
          <span className="size-3 rounded-full bg-[#6e6e6e]" />
          <span className="size-3 rounded-full bg-[#6e6e6e]" />
        </>
      )
    }
    const ac = data.accentColor
    return (
      <>
        <span className="size-3 rounded-full" style={{ background: ac ?? '#ff5f57' }} />
        <span className="size-3 rounded-full" style={{ background: ac ?? '#febc2e' }} />
        <span className="size-3 rounded-full" style={{ background: ac ?? '#28c840' }} />
      </>
    )
  }

  // ---------------------------------------------------------------------------
  // Chrome wrapper
  // ---------------------------------------------------------------------------
  const borderStyle: React.CSSProperties = data.borderWidth
    ? {
        borderWidth: data.borderWidth,
        borderStyle: 'solid',
        borderColor: data.borderColor ?? 'rgba(255,255,255,0.15)',
      }
    : {}

  const chrome = (body: React.ReactNode) => (
    <div style={outerStyle} className={className}>
      <div
        className={cn('flex flex-col overflow-hidden rounded-xl shadow-lg')}
        style={{
          background: bgColor,
          color: hl?.foreground,
          height: '100%',
          ...borderStyle,
        }}
      >
        {showWindowChrome && (
          <div
            className="flex h-[34px] shrink-0 items-stretch gap-2 border-b px-3 relative"
            style={{
              background: codeTheme === 'github-light' ? '#f3f3f3' : '#1f2428',
              borderColor: codeTheme === 'github-light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-1.5 h-full select-none mr-2">
              {accentDots()}
            </div>
 
            <div className="flex items-stretch gap-0 select-none h-full">
              {visibleFiles.map((f, i) => {
                const isActive = i === active
                const tabBg = isActive ? bgColor : 'transparent'
                const tabFg = isActive ? fgColor : (themeIsLight ? '#6a737d' : '#959da5')
                const tabTopBorder = isActive ? (themeIsLight ? '2px solid #005cc5' : '2px solid #007acc') : 'none'
                const tabRightBorder = themeIsLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'

                return (
                  <div
                    key={f.name + i}
                    className={cn(
                      'flex items-center gap-2 px-4 whitespace-nowrap cursor-pointer transition-colors h-full border-r',
                      isActive ? 'font-medium' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    )}
                    style={{
                      background: tabBg,
                      color: tabFg,
                      borderTop: tabTopBorder,
                      borderRight: tabRightBorder,
                      borderBottom: isActive ? `1px solid ${bgColor}` : '1px solid transparent',
                      marginBottom: isActive ? '-1px' : '0px',
                      position: 'relative',
                      zIndex: isActive ? 2 : 1,
                    }}
                  >

                    {editor && isActive && onChangeTitle ? (
                      <input
                        className="bg-transparent text-[11px] outline-none w-20 text-left font-medium"
                        style={{ color: tabFg }}
                        value={f.name}
                        onChange={(e) => onChangeTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setTab(i)
                          onChangeActiveFile?.(i)
                        }}
                        className="outline-none font-medium text-[11px] bg-transparent border-none p-0 cursor-pointer"
                        style={{ color: tabFg }}
                      >
                        {f.name}
                      </button>
                    )}

                    {editor && visibleFiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveFile?.(i)
                        }}
                        className="ml-2 rounded-sm p-0.5 hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-all flex items-center justify-center size-3.5 text-[9px] font-bold border-none bg-transparent cursor-pointer"
                        title="Close file"
                        style={{ color: tabFg }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}

              {editor && onAddFile && (
                <button
                  onClick={onAddFile}
                  className="px-3 py-1 opacity-60 hover:opacity-100 text-sm leading-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 self-center ml-1 text-muted-foreground border-none cursor-pointer flex items-center justify-center"
                  style={{ height: '24px' }}
                  title="New File..."
                >
                  +
                </button>
              )}
            </div>
          </div>
        )}
        <div className="relative min-h-0 flex-1">{body}</div>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Editable mode — transparent textarea overlay on highlighted code
  // ---------------------------------------------------------------------------
  if (editable) {
    return chrome(
      <div className="relative h-full overflow-hidden">
        {/* 1. Shiki-highlighted tokens — always visible */}
        <div
          ref={highlightScrollRef}
          className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none select-none no-scrollbar"
          style={{
            ...codeStyle,
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingRight: '16px',
            paddingLeft: '16px',
          }}
          aria-hidden
        >
          <div className="w-max min-w-full">{effectiveLines.map(renderLine)}</div>
        </div>

        {/* 2. Transparent textarea — receives input, shows caret only */}
        <textarea
          ref={textareaRef}
          autoFocus
          spellCheck={false}
          value={file.code}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => {
            // Tab key inserts spaces instead of moving focus
            if (e.key === 'Tab') {
              e.preventDefault()
              const el = e.currentTarget
              const startPos = el.selectionStart
              const endPos = el.selectionEnd
              const before = file.code.slice(0, startPos)
              const after = file.code.slice(endPos)
              const spaces = ' '.repeat(tabSize)
              const nextValue = before + spaces + after
              onChange?.(nextValue)
              
              // We need to restore the selection after React re-renders!
              setTimeout(() => {
                el.selectionStart = el.selectionEnd = startPos + spaces.length
                syncScroll()
              }, 0)
            }
          }}
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre outline-none border-none m-0"
          style={{
            ...codeStyle,
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingRight: '16px',
            paddingLeft: data.showLineNumbers !== false ? '64px' : '16px',
            background: 'transparent',
            // Make text invisible — only caret shows
            color: 'transparent',
            caretColor: hl?.foreground ?? fgColor,
            WebkitTextFillColor: 'transparent',
            boxSizing: 'border-box',
          }}
        />
      </div>,
    )
  }

  // ---------------------------------------------------------------------------
  // Editor (full code + viewable band + drag-to-pan)
  // ---------------------------------------------------------------------------
  if (editor) {
    const bandTop = (start - 1) * lineHeight
    const bandHeight = (end - start + 1) * lineHeight
    return chrome(
      <div
        ref={scrollRef}
        className="h-full overflow-auto"
        style={{
          ...codeStyle,
          padding: '16px',
          cursor: isPanMode ? 'grab' : 'default',
          userSelect: isPanMode ? 'none' : 'auto',
        }}
        onMouseDown={isPanMode ? handlePanStart : undefined}
      >
        <div className="relative">
          {data.visibleRange && (
            <div
              className="pointer-events-none absolute right-0 left-0 rounded border-l-2 border-sky-500 bg-sky-500/10"
              style={{ top: bandTop, height: bandHeight }}
            />
          )}
          {effectiveLines.map(renderLine)}
        </div>
      </div>,
    )
  }

  // ---------------------------------------------------------------------------
  // Present (clipped reveal window)
  // ---------------------------------------------------------------------------
  return chrome(
    <div
      className="h-full overflow-hidden"
      style={{
        ...codeStyle,
        padding: '16px',
      }}
    >
      <div style={{ transform: `translateY(${-(start - 1) * lineHeight}px)`, willChange: 'transform' }}>
        {effectiveLines.map(renderLine)}
      </div>
    </div>,
  )
}
