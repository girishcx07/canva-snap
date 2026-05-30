'use client'

// Editor workspace shell (canvas-first). Layout:
//   Toolbar
//   [ dual sidebar ] [ canvas + bottom slide strip ] [ right inspector ]
// The icon rail is always visible; the secondary panel + right inspector are
// collapsible/resizable.

import { useEffect, useRef } from 'react'

import { createSampleProject } from '../sample-project'
import { saveProject, loadProject } from '../storage'
import { EditorStore } from '../store'
import type { Project } from '../types'
import { Canvas } from './canvas'
import { Inspector } from './inspector'
import { ResizablePanel } from './panel'
import { Sidebar } from './sidebar'
import { SlideStrip } from './slide-strip'
import { Toolbar } from './toolbar'

export function Editor({ project }: { project?: Project }) {
  const storeRef = useRef<EditorStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = new EditorStore(project ?? createSampleProject())
  }
  const store = storeRef.current

  // Load a previously saved version (client only) and persist every change so
  // the runtime presents the edited document, not the initial template.
  useEffect(() => {
    const saved = loadProject(store.getState().project.id)
    if (saved) store.replaceProject(saved)
    let last = store.getState().project
    const unsubscribe = store.subscribe(() => {
      const current = store.getState().project
      if (current !== last) {
        last = current
        saveProject(current)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [store])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = store.getState().selectedLayerIds
        if (ids.length) {
          e.preventDefault()
          ids.forEach((id) => store.deleteLayer(id))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store])

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <Toolbar store={store} />
      <div className="flex min-h-0 flex-1">
        <Sidebar store={store} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Canvas store={store} />
          <SlideStrip store={store} />
        </div>

        <ResizablePanel
          side="right"
          storageKey="deck.panel.right"
          defaultWidth={288}
          min={240}
          max={420}
        >
          <Inspector store={store} />
        </ResizablePanel>
      </div>
    </div>
  )
}
