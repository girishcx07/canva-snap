// Lightweight project persistence (localStorage). Lets the editor and the
// runtime share the same edited document. A real backend would replace this
// behind the same load/save interface.

import type { Project } from './types'

const KEY = (id: string) => `deck.project.${id}`

export function saveProject(project: Project): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY(project.id), JSON.stringify(project))
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function loadProject(id: string): Project | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY(id))
    return raw ? (JSON.parse(raw) as Project) : null
  } catch {
    return null
  }
}
