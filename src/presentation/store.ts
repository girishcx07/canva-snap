'use client'

// Reactive editor store. Wraps the pure `doc` operations with subscription,
// selection/UI state, and an undo/redo stack (version-history ready).
// Decoupled from rendering: any view subscribes via `useEditorStore`.

import { useSyncExternalStore } from 'react'

import * as doc from './doc'
import type { ID, Layer, Project, Slide } from './types'

export type EditorState = {
  project: Project
  currentSlideId: ID
  selectedLayerIds: ID[]
  // Transient signal: hover an animation preset to preview it on the canvas.
  preview?: { layerId: ID; presetId: string; n: number }
}

type Listener = () => void

export class EditorStore {
  private state: EditorState
  private listeners = new Set<Listener>()
  private past: Project[] = []
  private future: Project[] = []
  private txnStart: Project | null = null

  constructor(project: Project) {
    this.state = {
      project,
      currentSlideId: project.slides[0]?.id ?? '',
      selectedLayerIds: [],
    }
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = (): EditorState => this.state

  private emit() {
    this.state = { ...this.state }
    for (const listener of this.listeners) listener()
  }

  private setUi(patch: Partial<EditorState>) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }

  // Project mutations push onto the undo stack.
  private commit(next: Project) {
    this.past.push(this.state.project)
    if (this.past.length > 100) this.past.shift()
    this.future = []
    this.state.project = next
    this.emit()
  }

  get currentSlide(): Slide {
    const { project, currentSlideId } = this.state
    return (
      project.slides.find((s) => s.id === currentSlideId) ?? project.slides[0]
    )
  }

  // --- UI state ---
  selectSlide = (slideId: ID) =>
    this.setUi({ currentSlideId: slideId, selectedLayerIds: [] })

  select = (ids: ID[]) => this.setUi({ selectedLayerIds: ids })

  toggleSelect = (id: ID, additive: boolean) => {
    const current = this.state.selectedLayerIds
    if (!additive) return this.select([id])
    this.select(
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    )
  }

  clearSelection = () => this.select([])

  // Fire a one-shot animation preview on the canvas (no history).
  previewAnimation = (layerId: ID, presetId: string) =>
    this.setUi({ preview: { layerId, presetId, n: (this.state.preview?.n ?? 0) + 1 } })

  // --- History ---
  canUndo = () => this.past.length > 0
  canRedo = () => this.future.length > 0

  undo = () => {
    const prev = this.past.pop()
    if (!prev) return
    this.future.push(this.state.project)
    this.state.project = prev
    this.emit()
  }

  redo = () => {
    const next = this.future.pop()
    if (!next) return
    this.past.push(this.state.project)
    this.state.project = next
    this.emit()
  }

  // --- Transactions: coalesce a drag/resize gesture into one undo entry ---
  beginTransaction = () => {
    this.txnStart = this.state.project
  }

  // Live update during a gesture (no history push).
  liveTransform = (layerId: ID, patch: Partial<Layer['transform']>) => {
    this.state.project = doc.patchTransform(
      this.state.project,
      this.state.currentSlideId,
      layerId,
      patch,
    )
    this.emit()
  }

  commitTransaction = () => {
    if (this.txnStart && this.txnStart !== this.state.project) {
      this.past.push(this.txnStart)
      if (this.past.length > 100) this.past.shift()
      this.future = []
    }
    this.txnStart = null
  }

  // --- Layer commands ---
  addLayer = (layer: Layer) => {
    this.commit(doc.addLayer(this.state.project, this.state.currentSlideId, layer))
    this.select([layer.id])
  }

  patchLayer = (layerId: ID, patch: Partial<Layer>) =>
    this.commit(
      doc.patchLayer(this.state.project, this.state.currentSlideId, layerId, patch),
    )

  patchTransform = (layerId: ID, patch: Partial<Layer['transform']>) =>
    this.commit(
      doc.patchTransform(
        this.state.project,
        this.state.currentSlideId,
        layerId,
        patch,
      ),
    )

  deleteLayer = (layerId: ID) => {
    this.commit(
      doc.deleteLayer(this.state.project, this.state.currentSlideId, layerId),
    )
    this.select(this.state.selectedLayerIds.filter((x) => x !== layerId))
  }

  duplicateLayer = (layerId: ID) =>
    this.commit(
      doc.duplicateLayer(this.state.project, this.state.currentSlideId, layerId),
    )

  reorderLayer = (layerId: ID, toIndex: number) =>
    this.commit(
      doc.reorderLayer(
        this.state.project,
        this.state.currentSlideId,
        layerId,
        toIndex,
      ),
    )

  // --- Slide commands ---
  addSlide = () => {
    const next = doc.addSlide(this.state.project, this.state.currentSlideId)
    this.commit(next)
    this.selectSlide(next.slides[next.slides.length - 1].id)
  }

  duplicateSlide = (slideId: ID) =>
    this.commit(doc.duplicateSlide(this.state.project, slideId))

  deleteSlide = (slideId: ID) => {
    const next = doc.deleteSlide(this.state.project, slideId)
    this.commit(next)
    if (slideId === this.state.currentSlideId) {
      this.selectSlide(next.slides[0].id)
    }
  }

  reorderSlide = (slideId: ID, toIndex: number) =>
    this.commit(doc.reorderSlide(this.state.project, slideId, toIndex))

  patchSlide = (slideId: ID, patch: Partial<Slide>) =>
    this.commit(doc.patchSlide(this.state.project, slideId, patch))

  patchProject = (patch: Partial<Project>) =>
    this.commit(doc.patchProject(this.state.project, patch))

  // Replace the whole document (e.g. loading a persisted/saved project).
  replaceProject = (project: Project) => {
    this.past = []
    this.future = []
    this.txnStart = null
    this.state = {
      project,
      currentSlideId: project.slides[0]?.id ?? '',
      selectedLayerIds: [],
    }
    for (const listener of this.listeners) listener()
  }
}

// React binding ------------------------------------------------------------

export function useEditorStore<T>(
  store: EditorStore,
  selector: (state: EditorState) => T,
): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  )
}
