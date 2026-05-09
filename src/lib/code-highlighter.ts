import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export type CodeTheme = 'github-light' | 'github-dark'

export type HighlightedCode = {
  background?: string
  foreground?: string
  lines: HighlightedLine[]
}

export type HighlightedLine = HighlightedToken[]

export type HighlightedToken = {
  color?: string
  content: string
  fontStyle?: number
}

export const codeThemeOptions = [
  { label: 'Light', value: 'github-light' },
  { label: 'Dark', value: 'github-dark' },
] satisfies { label: string; value: CodeTheme }[]

const languageLoaders = {
  astro: () => import('shiki/langs/astro.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
  c: () => import('shiki/langs/c.mjs'),
  cpp: () => import('shiki/langs/cpp.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  dockerfile: () => import('shiki/langs/dockerfile.mjs'),
  dotenv: () => import('shiki/langs/dotenv.mjs'),
  go: () => import('shiki/langs/go.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  makefile: () => import('shiki/langs/makefile.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  mdx: () => import('shiki/langs/mdx.mjs'),
  php: () => import('shiki/langs/php.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  ruby: () => import('shiki/langs/ruby.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  scss: () => import('shiki/langs/scss.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  svelte: () => import('shiki/langs/svelte.mjs'),
  toml: () => import('shiki/langs/toml.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  vue: () => import('shiki/langs/vue.mjs'),
  xml: () => import('shiki/langs/xml.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
}

const themeLoaders = {
  'github-dark': () => import('shiki/themes/github-dark.mjs'),
  'github-light': () => import('shiki/themes/github-light.mjs'),
} satisfies Record<CodeTheme, () => Promise<unknown>>

const loadedLanguages = new Set<string>()
const loadedThemes = new Set<CodeTheme>()
let highlighterPromise: ReturnType<typeof createRepoHighlighter> | null = null

export async function highlightCode(input: {
  code: string
  language: string
  theme: CodeTheme
}): Promise<HighlightedCode> {
  const highlighter = await getHighlighter()
  const language = normalizeLanguage(input.language)

  if (language !== 'text' && !loadedLanguages.has(language)) {
    await highlighter.loadLanguage(languageLoaders[language]())
    loadedLanguages.add(language)
  }

  if (!loadedThemes.has(input.theme)) {
    await highlighter.loadTheme(themeLoaders[input.theme]())
    loadedThemes.add(input.theme)
  }

  const result = highlighter.codeToTokens(input.code, {
    lang: language,
    theme: input.theme,
  })

  return {
    background: result.bg,
    foreground: result.fg,
    lines: result.tokens,
  }
}

function getHighlighter() {
  highlighterPromise ??= createRepoHighlighter()
  return highlighterPromise
}

function createRepoHighlighter() {
  return createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [],
    themes: [],
  })
}

function normalizeLanguage(language: string) {
  if (language in languageLoaders) {
    return language as keyof typeof languageLoaders
  }

  return 'text'
}
