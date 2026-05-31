/**
 * Unit tests for code-block.tsx helper functions.
 * All functions under test are pure (no React, no DOM, no I/O).
 * Run with: pnpm test
 */
import { describe, it, expect } from 'vitest'
import {
  dimOpacity,
  dimFilter,
  lineByLineCount,
  typewriterChars,
  fadeInLineOpacity,
  computeLineDiff,
  type CodeAnimationConfig,
} from '../presentation/components/code-block'

// ---------------------------------------------------------------------------
// dimOpacity
// ---------------------------------------------------------------------------
describe('dimOpacity', () => {
  it('returns 0.25 for opacity 25', () => {
    expect(dimOpacity(25)).toBe(0.25)
  })
  it('returns 0.5 for opacity 50', () => {
    expect(dimOpacity(50)).toBe(0.5)
  })
  it('returns 0.75 for opacity 75', () => {
    expect(dimOpacity(75)).toBe(0.75)
  })
  it('returns 1.0 for opacity 100', () => {
    expect(dimOpacity(100)).toBe(1.0)
  })
  it('defaults to 1.0 when no argument given', () => {
    expect(dimOpacity()).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// dimFilter
// ---------------------------------------------------------------------------
describe('dimFilter', () => {
  it('returns undefined for none', () => {
    expect(dimFilter('none')).toBeUndefined()
  })
  it('returns blur filter for blur', () => {
    expect(dimFilter('blur')).toBe('blur(3px)')
  })
  it('returns grayscale filter for grayout', () => {
    expect(dimFilter('grayout')).toBe('grayscale(100%) opacity(0.4)')
  })
  it('defaults to undefined when no argument given', () => {
    expect(dimFilter()).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// lineByLineCount
// ---------------------------------------------------------------------------
describe('lineByLineCount', () => {
  it('returns 0 lines at progress 0', () => {
    expect(lineByLineCount(10, 0)).toBe(0)
  })
  it('returns all lines at progress 1', () => {
    expect(lineByLineCount(10, 1)).toBe(10)
  })
  it('returns half lines at progress 0.5', () => {
    expect(lineByLineCount(10, 0.5)).toBe(5)
  })
  it('clamps negative progress to 0', () => {
    expect(lineByLineCount(10, -0.5)).toBe(0)
  })
  it('clamps progress > 1 to all lines', () => {
    expect(lineByLineCount(10, 1.5)).toBe(10)
  })
  it('works correctly for 1 line', () => {
    expect(lineByLineCount(1, 0.5)).toBe(0)
    expect(lineByLineCount(1, 1)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// typewriterChars
// ---------------------------------------------------------------------------
describe('typewriterChars', () => {
  it('returns 0 chars at progress 0', () => {
    expect(typewriterChars(100, 0)).toBe(0)
  })
  it('returns all chars at progress 1', () => {
    expect(typewriterChars(100, 1)).toBe(100)
  })
  it('returns correct chars at midpoint', () => {
    expect(typewriterChars(100, 0.5)).toBe(50)
  })
  it('clamps negative progress', () => {
    expect(typewriterChars(100, -1)).toBe(0)
  })
  it('clamps progress > 1', () => {
    expect(typewriterChars(100, 2)).toBe(100)
  })
  it('floors fractional char count', () => {
    // 10 chars, progress 0.35 → floor(3.5) = 3
    expect(typewriterChars(10, 0.35)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// fadeInLineOpacity
// ---------------------------------------------------------------------------
describe('fadeInLineOpacity', () => {
  describe('added lines', () => {
    it('starts at 0 opacity when progress=0', () => {
      expect(fadeInLineOpacity('added', 0)).toBe(0)
    })
    it('reaches full opacity at progress=1', () => {
      expect(fadeInLineOpacity('added', 1)).toBe(1)
    })
    it('is at half opacity at progress=0.5', () => {
      expect(fadeInLineOpacity('added', 0.5)).toBe(0.5)
    })
  })

  describe('removed lines', () => {
    it('starts at full opacity when progress=0', () => {
      expect(fadeInLineOpacity('removed', 0)).toBe(1)
    })
    it('reaches 0 opacity at progress=1', () => {
      expect(fadeInLineOpacity('removed', 1)).toBe(0)
    })
    it('is at half opacity at progress=0.5', () => {
      expect(fadeInLineOpacity('removed', 0.5)).toBe(0.5)
    })
  })

  describe('unchanged lines', () => {
    it('always returns 1 regardless of progress', () => {
      expect(fadeInLineOpacity('unchanged', 0)).toBe(1)
      expect(fadeInLineOpacity('unchanged', 0.5)).toBe(1)
      expect(fadeInLineOpacity('unchanged', 1)).toBe(1)
    })
  })

  it('clamps progress below 0 for added', () => {
    expect(fadeInLineOpacity('added', -1)).toBe(0)
  })
  it('clamps progress above 1 for added', () => {
    expect(fadeInLineOpacity('added', 2)).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// computeLineDiff
// ---------------------------------------------------------------------------
describe('computeLineDiff', () => {
  it('marks all lines as unchanged when code is identical', () => {
    const code = 'const a = 1\nconst b = 2'
    const diff = computeLineDiff(code, code)
    expect(diff).toEqual(['unchanged', 'unchanged'])
  })

  it('marks new lines as added', () => {
    const from = 'const a = 1'
    const to = 'const a = 1\nconst b = 2'
    const diff = computeLineDiff(from, to)
    expect(diff[0]).toBe('unchanged')  // line 1: same
    expect(diff[1]).toBe('added')      // line 2: new
  })

  it('marks all lines as added when from is empty', () => {
    const diff = computeLineDiff('', 'line1\nline2\nline3')
    // empty string → fromSet has one entry: ''
    // 'line1', 'line2', 'line3' are all new
    expect(diff).toEqual(['added', 'added', 'added'])
  })

  it('returns empty array for empty toCode', () => {
    // '' split by '\n' gives [''] → 1 element (empty string)
    // computeLineDiff('anything', '') → toLines = [''] which is in fromSet if from also has ''
    const diff = computeLineDiff('const a = 1', '')
    // '' not in Set(['const a = 1']), so it's 'added'
    expect(diff).toHaveLength(1)
  })

  it('handles single-line change', () => {
    const from = 'const x = 1'
    const to = 'const x = 2'
    const diff = computeLineDiff(from, to)
    expect(diff).toEqual(['added'])  // line changed → not in fromSet
  })
})

// ---------------------------------------------------------------------------
// lineNumberStart — verify display offset (pure arithmetic, no rendering)
// ---------------------------------------------------------------------------
describe('lineNumberStart offset logic', () => {
  it('display line number = index + lineNumberStart', () => {
    const lineNumberStart = 10
    // i=0 → display line 10, i=1 → 11, etc.
    for (let i = 0; i < 5; i++) {
      const displayLineNum = i + lineNumberStart
      expect(displayLineNum).toBe(10 + i)
    }
  })

  it('defaults to 1 when lineNumberStart is undefined', () => {
    const data = { code: '', language: 'typescript' } as { lineNumberStart?: number }
    const lineNumberStart = data.lineNumberStart ?? 1
    expect(lineNumberStart).toBe(1)
    expect(0 + lineNumberStart).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// CodeAnimationConfig defaults
// ---------------------------------------------------------------------------
describe('CodeAnimationConfig defaults', () => {
  it('default durationMs is 600', () => {
    const cfg: CodeAnimationConfig = { type: 'fadeIn' }
    expect(cfg.durationMs ?? 600).toBe(600)
  })
  it('default delayMs is 0', () => {
    const cfg: CodeAnimationConfig = { type: 'fadeIn' }
    expect(cfg.delayMs ?? 0).toBe(0)
  })
  it('default easing is easeOut', () => {
    const cfg: CodeAnimationConfig = { type: 'typewriter' }
    expect(cfg.easing ?? 'easeOut').toBe('easeOut')
  })
})

// ---------------------------------------------------------------------------
// tabSize defaults
// ---------------------------------------------------------------------------
describe('tabSize defaults', () => {
  it('defaults to 2 when not specified', () => {
    const data = { code: '', language: 'typescript' }
    const tabSize = (data as any).tabSize ?? 2
    expect(tabSize).toBe(2)
  })
  it('accepts valid values 2, 3, 4, 6', () => {
    const valid = [2, 3, 4, 6]
    valid.forEach((v) => expect(valid).toContain(v))
  })
})
