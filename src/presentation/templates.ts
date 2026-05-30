// Starter templates. A template is just a Project builder; applying one
// replaces the current document. Includes a blank white deck for "new project".

import { defaultTransform, uid } from './doc'
import { createSampleProject } from './sample-project'
import type { Layer, Project, Slide } from './types'

function whiteSlide(name: string, layers: Layer[]): Slide {
  return {
    id: uid('slide'),
    name,
    background: '#ffffff',
    layers,
    transition: { type: 'morph', durationMs: 600, easing: 'easeInOut' },
    notes: '',
  }
}

function text(
  type: string,
  data: Record<string, unknown>,
  transform: Parameters<typeof defaultTransform>[0],
  style: Layer['style'],
): Layer {
  return {
    id: uid('layer'),
    type,
    name: type,
    transform: defaultTransform(transform),
    style,
    locked: false,
    hidden: false,
    data,
    animations: [],
    events: [],
  }
}

function project(name: string, slides: Slide[]): Project {
  const now = new Date().toISOString()
  return {
    id: 'sample',
    name,
    description: '',
    width: 1280,
    height: 720,
    theme: 'light',
    slides,
    createdAt: now,
    updatedAt: now,
  }
}

export function createBlankProject(): Project {
  return project('Untitled', [whiteSlide('Slide 1', [])])
}

function titleDeck(): Project {
  return project('Title', [
    whiteSlide('Title', [
      text('heading', { text: 'Presentation title' }, { x: 160, y: 280, width: 960, height: 100 }, { fontSize: 64, fontWeight: 800, color: '#0f172a' }),
      text('text', { text: 'Subtitle goes here' }, { x: 162, y: 400, width: 800, height: 50 }, { fontSize: 26, color: '#475569' }),
    ]),
  ])
}

function codeDeck(): Project {
  return project('Code walkthrough', [
    whiteSlide('Code', [
      text('heading', { text: 'Walkthrough' }, { x: 80, y: 70, width: 1120, height: 70 }, { fontSize: 40, fontWeight: 800, color: '#0f172a' }),
      text(
        'code',
        { code: 'function demo() {\n  return 42\n}', language: 'typescript', showLineNumbers: true, visibleRange: [1, 3] },
        { x: 80, y: 170, width: 1120, height: 460 },
        {},
      ),
    ]),
  ])
}

export type Template = {
  id: string
  label: string
  build: () => Project
}

// The Flexbox sample is the default template.
export const TEMPLATES: Template[] = [
  { id: 'flexbox', label: 'CSS Flexbox (sample)', build: createSampleProject },
  { id: 'blank', label: 'Blank', build: createBlankProject },
  { id: 'title', label: 'Title slide', build: titleDeck },
  { id: 'code', label: 'Code walkthrough', build: codeDeck },
]
