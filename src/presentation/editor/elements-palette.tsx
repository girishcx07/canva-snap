'use client'

// Elements palette. Lists registered components grouped by category; clicking
// one inserts a new layer (centered) on the current slide.

import { uid } from '../doc'
import {
  COMPONENT_CATEGORIES,
  componentsByCategory,
  createLayerOfType,
} from '../registry'
import type { EditorStore } from '../store'
import { useEditorStore } from '../store'

export function ElementsPalette({ store }: { store: EditorStore }) {
  const project = useEditorStore(store, (s) => s.project)

  function add(type: string) {
    const layer = createLayerOfType(type, uid('layer'))
    if (!layer) return
    layer.transform.x = Math.round(project.width / 2 - layer.transform.width / 2)
    layer.transform.y = Math.round(project.height / 2 - layer.transform.height / 2)
    store.addLayer(layer)
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto pr-1">
      {COMPONENT_CATEGORIES.map((category) => {
        const items = componentsByCategory(category)
        if (items.length === 0) return null
        return (
          <div key={category} className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground capitalize">
              {category}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((def) => (
                <button
                  key={def.type}
                  onClick={() => add(def.type)}
                  className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-xs transition-colors hover:bg-muted"
                >
                  <def.icon className="size-5 text-muted-foreground" />
                  {def.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
