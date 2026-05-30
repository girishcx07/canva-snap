// Sample project: a CSS Flexbox lesson built the "real" way — out of layers.
// Each slide changes one CSS property in the code block (left) while the actual
// box layers (right) morph to the new layout. The morph engine animates the
// boxes between arrangements, demonstrating flexbox side-by-side with the code.

import { defaultTransform, uid } from './doc'
import type {
  AnimationInstance,
  EventBinding,
  Layer,
  Project,
  Slide,
  Transform,
} from './types'

function layer(init: {
  type: string
  name: string
  morphKey?: string
  transform: Partial<Transform>
  style?: Layer['style']
  data?: Record<string, unknown>
  animations?: AnimationInstance[]
  events?: EventBinding[]
}): Layer {
  return {
    id: uid('layer'),
    type: init.type,
    name: init.name,
    morphKey: init.morphKey,
    transform: defaultTransform(init.transform),
    style: init.style ?? {},
    locked: false,
    hidden: false,
    data: init.data ?? {},
    animations: init.animations ?? [],
    events: init.events ?? [],
  }
}

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b']

// Box layers keyed stably so they morph across slides.
function boxes(rects: { x: number; y: number; w: number; h: number }[]): Layer[] {
  return rects.map((r, i) =>
    layer({
      type: 'shape',
      name: `Box ${i + 1}`,
      morphKey: `box-${i + 1}`,
      transform: { x: r.x, y: r.y, width: r.w, height: r.h },
      style: { fill: COLORS[i % COLORS.length], borderRadius: 16 },
    }),
  )
}

function cssCode(justify: string, align: string): string {
  return `.container {
  display: flex;
  justify-content: ${justify};
  align-items: ${align};
  gap: 24px;
}`
}

function codeLayer(justify: string, align: string, focusLines: number[]): Layer {
  return layer({
    type: 'code',
    name: 'CSS',
    morphKey: 'code',
    transform: { x: 80, y: 180, width: 540, height: 380 },
    data: {
      code: cssCode(justify, align),
      language: 'css',
      showLineNumbers: true,
      focusLines,
    },
  })
}

function container(): Layer {
  return layer({
    type: 'shape',
    name: 'Container',
    morphKey: 'container',
    transform: { x: 660, y: 180, width: 540, height: 380 },
    style: { fill: '#f1f5f9', borderRadius: 20, borderColor: '#cbd5e1', borderWidth: 2 },
  })
}

function title(text: string, animate = false): Layer {
  return layer({
    type: 'heading',
    name: 'Title',
    morphKey: 'title',
    transform: { x: 80, y: 70, width: 1120, height: 70 },
    style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
    data: { text },
    events: animate ? [entrance('slide-in')] : [],
  })
}

function slide(name: string, layers: Layer[]): Slide {
  return {
    id: uid('slide'),
    name,
    background: '#ffffff',
    transition: { type: 'morph', durationMs: 700, easing: 'easeInOut' },
    notes: '',
    layers,
  }
}

// Box layouts inside the container (inner area ~ x:680..1180, y:200..540).
const START = [
  { x: 680, y: 325, w: 110, h: 110 },
  { x: 814, y: 325, w: 110, h: 110 },
  { x: 948, y: 325, w: 110, h: 110 },
]
const CENTER = [
  { x: 741, y: 325, w: 110, h: 110 },
  { x: 875, y: 325, w: 110, h: 110 },
  { x: 1009, y: 325, w: 110, h: 110 },
]
const BETWEEN = [
  { x: 680, y: 325, w: 110, h: 110 },
  { x: 875, y: 325, w: 110, h: 110 },
  { x: 1070, y: 325, w: 110, h: 110 },
]
const ALIGN_START = [
  { x: 741, y: 210, w: 110, h: 110 },
  { x: 875, y: 210, w: 110, h: 160 },
  { x: 1009, y: 210, w: 110, h: 80 },
]

export function createSampleProject(): Project {
  const now = new Date().toISOString()

  const slides: Slide[] = [
    slide('Title', [
      layer({
        type: 'shape',
        name: 'Accent',
        morphKey: 'accent',
        transform: { x: 120, y: 150, width: 240, height: 240 },
        style: { fill: '#7c3aed', borderRadius: 48 },
      }),
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 120, y: 410, width: 900, height: 100 },
        style: { fontSize: 72, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Flexbox' },
        events: [entrance('slide-in')],
      }),
      layer({
        type: 'text',
        name: 'Subtitle',
        morphKey: 'subtitle',
        transform: { x: 122, y: 530, width: 800, height: 50 },
        style: { fontSize: 26, color: '#475569' },
        data: { text: 'Watch the layout morph as the code changes' },
        events: [entrance('fade-in', 250)],
      }),
    ]),

    slide('justify-content: flex-start', [
      title('justify-content: flex-start'),
      codeLayer('flex-start', 'center', [3]),
      container(),
      ...boxes(START),
    ]),

    slide('justify-content: center', [
      title('justify-content: center'),
      codeLayer('center', 'center', [3]),
      container(),
      ...boxes(CENTER),
    ]),

    slide('justify-content: space-between', [
      title('justify-content: space-between'),
      codeLayer('space-between', 'center', [3]),
      container(),
      ...boxes(BETWEEN),
    ]),

    slide('align-items: flex-start', [
      title('align-items: flex-start'),
      codeLayer('center', 'flex-start', [4]),
      container(),
      ...boxes(ALIGN_START),
    ]),

    slide('Outro', [
      layer({
        type: 'shape',
        name: 'Accent',
        morphKey: 'accent',
        transform: { x: 520, y: 130, width: 240, height: 240 },
        style: { fill: '#06b6d4', borderRadius: 120 },
      }),
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 240, y: 430, width: 800, height: 90 },
        style: { fontSize: 56, fontWeight: 800, color: '#0f172a', textAlign: 'center' },
        data: { text: 'That is Flexbox' },
      }),
      layer({
        type: 'button',
        name: 'CTA',
        transform: { x: 560, y: 550, width: 180, height: 56 },
        style: { fill: '#7c3aed', color: '#ffffff', borderRadius: 14, fontSize: 18, fontWeight: 700 },
        data: { label: 'Restart' },
        events: [
          attention('pulse'),
          {
            id: uid('evt'),
            trigger: 'click',
            actions: [{ type: 'navigate-slide', params: { target: 0 } }],
          },
        ],
      }),
    ]),
  ]

  return {
    id: 'sample',
    name: 'CSS Flexbox — morph lesson',
    description: 'Flexbox taught layer-by-layer: code changes, layout morphs.',
    width: 1280,
    height: 720,
    theme: 'light',
    slides,
    createdAt: now,
    updatedAt: now,
  }
}

function entrance(presetId: string, delayMs = 0): EventBinding {
  return {
    id: uid('evt'),
    trigger: 'slide-enter',
    actions: [
      {
        type: 'animate-layer',
        params: {
          layerId: 'self',
          presetId,
          delayMs,
          durationMs: 600,
          easing: 'easeOut',
        },
      },
    ],
  }
}

function attention(presetId: string): EventBinding {
  return {
    id: uid('evt'),
    trigger: 'slide-enter',
    actions: [
      {
        type: 'animate-layer',
        params: {
          layerId: 'self',
          presetId,
          delayMs: 600,
          durationMs: 700,
          easing: 'easeInOut',
        },
      },
    ],
  }
}
