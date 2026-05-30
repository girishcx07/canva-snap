// Pure, immutable operations over the presentation document.
// No React, no store, no side effects -> trivially testable and reusable by a
// future collaboration layer (each function maps cleanly to an intent/op).

import type { ID, Layer, Project, Slide, Transform } from './types'

export function uid(prefix = 'id'): ID {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function defaultTransform(patch: Partial<Transform> = {}): Transform {
  return {
    x: 0,
    y: 0,
    width: 200,
    height: 120,
    rotation: 0,
    scale: 1,
    opacity: 1,
    ...patch,
  }
}

// --- Layer tree helpers (layers can nest via `children`) -------------------

export function findLayer(layers: Layer[], id: ID): Layer | undefined {
  for (const layer of layers) {
    if (layer.id === id) return layer
    if (layer.children) {
      const found = findLayer(layer.children, id)
      if (found) return found
    }
  }
  return undefined
}

export function mapLayers(
  layers: Layer[],
  fn: (layer: Layer) => Layer,
): Layer[] {
  return layers.map((layer) => {
    const next = fn(layer)
    if (next.children) {
      return { ...next, children: mapLayers(next.children, fn) }
    }
    return next
  })
}

export function removeLayer(layers: Layer[], id: ID): Layer[] {
  return layers
    .filter((layer) => layer.id !== id)
    .map((layer) =>
      layer.children
        ? { ...layer, children: removeLayer(layer.children, id) }
        : layer,
    )
}

// --- Slide-level operations ------------------------------------------------

function updateSlide(
  project: Project,
  slideId: ID,
  fn: (slide: Slide) => Slide,
): Project {
  return touch({
    ...project,
    slides: project.slides.map((s) => (s.id === slideId ? fn(s) : s)),
  })
}

export function addLayer(
  project: Project,
  slideId: ID,
  layer: Layer,
): Project {
  return updateSlide(project, slideId, (slide) => ({
    ...slide,
    layers: [...slide.layers, layer],
  }))
}

export function patchLayer(
  project: Project,
  slideId: ID,
  layerId: ID,
  patch: Partial<Layer>,
): Project {
  return updateSlide(project, slideId, (slide) => ({
    ...slide,
    layers: mapLayers(slide.layers, (layer) =>
      layer.id === layerId ? { ...layer, ...patch } : layer,
    ),
  }))
}

export function patchTransform(
  project: Project,
  slideId: ID,
  layerId: ID,
  patch: Partial<Transform>,
): Project {
  return updateSlide(project, slideId, (slide) => ({
    ...slide,
    layers: mapLayers(slide.layers, (layer) =>
      layer.id === layerId
        ? { ...layer, transform: { ...layer.transform, ...patch } }
        : layer,
    ),
  }))
}

export function deleteLayer(
  project: Project,
  slideId: ID,
  layerId: ID,
): Project {
  return updateSlide(project, slideId, (slide) => ({
    ...slide,
    layers: removeLayer(slide.layers, layerId),
  }))
}

export function reorderLayer(
  project: Project,
  slideId: ID,
  layerId: ID,
  toIndex: number,
): Project {
  return updateSlide(project, slideId, (slide) => {
    const from = slide.layers.findIndex((l) => l.id === layerId)
    if (from < 0) return slide
    const layers = [...slide.layers]
    const [moved] = layers.splice(from, 1)
    layers.splice(Math.max(0, Math.min(toIndex, layers.length)), 0, moved)
    return { ...slide, layers }
  })
}

export function duplicateLayer(
  project: Project,
  slideId: ID,
  layerId: ID,
): Project {
  return updateSlide(project, slideId, (slide) => {
    const original = slide.layers.find((l) => l.id === layerId)
    if (!original) return slide
    const copy = cloneLayer(original)
    copy.transform = {
      ...copy.transform,
      x: copy.transform.x + 24,
      y: copy.transform.y + 24,
    }
    return { ...slide, layers: [...slide.layers, copy] }
  })
}

function cloneLayer(layer: Layer): Layer {
  return {
    ...structuredClone(layer),
    id: uid('layer'),
    children: layer.children?.map(cloneLayer),
  }
}

// --- Slide operations ------------------------------------------------------

export function addSlide(project: Project, afterId?: ID): Project {
  const slide: Slide = {
    id: uid('slide'),
    name: `Slide ${project.slides.length + 1}`,
    background: '#ffffff',
    layers: [],
    transition: { type: 'morph', durationMs: 600, easing: 'easeInOut' },
    notes: '',
  }
  const index = afterId
    ? project.slides.findIndex((s) => s.id === afterId) + 1
    : project.slides.length
  const slides = [...project.slides]
  slides.splice(index, 0, slide)
  return touch({ ...project, slides })
}

export function duplicateSlide(project: Project, slideId: ID): Project {
  const index = project.slides.findIndex((s) => s.id === slideId)
  if (index < 0) return project
  const copy: Slide = {
    ...structuredClone(project.slides[index]),
    id: uid('slide'),
    name: `${project.slides[index].name} copy`,
    layers: project.slides[index].layers.map(cloneLayer),
  }
  const slides = [...project.slides]
  slides.splice(index + 1, 0, copy)
  return touch({ ...project, slides })
}

export function deleteSlide(project: Project, slideId: ID): Project {
  if (project.slides.length <= 1) return project
  return touch({
    ...project,
    slides: project.slides.filter((s) => s.id !== slideId),
  })
}

export function reorderSlide(
  project: Project,
  slideId: ID,
  toIndex: number,
): Project {
  const from = project.slides.findIndex((s) => s.id === slideId)
  if (from < 0) return project
  const slides = [...project.slides]
  const [moved] = slides.splice(from, 1)
  slides.splice(Math.max(0, Math.min(toIndex, slides.length)), 0, moved)
  return touch({ ...project, slides })
}

export function patchSlide(
  project: Project,
  slideId: ID,
  patch: Partial<Slide>,
): Project {
  return updateSlide(project, slideId, (slide) => ({ ...slide, ...patch }))
}

export function patchProject(
  project: Project,
  patch: Partial<Project>,
): Project {
  return touch({ ...project, ...patch })
}

function touch(project: Project): Project {
  return { ...project, updatedAt: new Date().toISOString() }
}
