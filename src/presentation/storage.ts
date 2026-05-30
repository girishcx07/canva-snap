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

// --- Saved templates (history) ---------------------------------------------

export type SavedTemplate = { id: string; name: string; project: Project }

export function listSavedTemplates(): SavedTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('deck.templates') ?? '[]') as SavedTemplate[]
  } catch {
    return []
  }
}

export function saveTemplate(name: string, project: Project): SavedTemplate[] {
  const list = listSavedTemplates()
  list.unshift({ id: `tpl_${Date.now()}`, name, project })
  const next = list.slice(0, 24)
  try {
    localStorage.setItem('deck.templates', JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
