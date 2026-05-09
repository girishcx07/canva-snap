'use client'

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { CodeTheme } from '@/lib/code-highlighter'
import {
  getBrowserThemeMode,
  persistBrowserThemeMode,
  type ThemeMode,
} from './theme-utils'

type ThemeContextValue = {
  codeTheme: CodeTheme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setThemeMode] = useState<ThemeMode>(() => getBrowserThemeMode())

  useLayoutEffect(() => {
    persistBrowserThemeMode(mode)
  }, [mode])

  const value = useMemo<ThemeContextValue>(
    () => ({
      codeTheme: mode === 'dark' ? 'github-dark' : 'github-light',
      mode,
      setMode: (nextMode) => {
        persistBrowserThemeMode(nextMode)
        setThemeMode(nextMode)
      },
    }),
    [mode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return value
}
