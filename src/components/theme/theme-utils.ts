export type ThemeMode = 'light' | 'dark'

export const themeStorageKey = 'repo-browser-theme'

export function getThemeBootstrapScript() {
  return `try{var m=window.localStorage.getItem('${themeStorageKey}');if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',m==='dark');document.documentElement.style.colorScheme=m}catch{}`
}

export function getBrowserThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(themeStorageKey)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyBrowserThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
}

export function persistBrowserThemeMode(mode: ThemeMode) {
  applyBrowserThemeMode(mode)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(themeStorageKey, mode)
  }
}
