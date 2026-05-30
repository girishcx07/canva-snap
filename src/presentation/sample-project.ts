// Sample project: an interactive CSS Flexbox lesson. It showcases the platform
// headline features — morphing shared elements (title/accent), a live
// interactive demo element, and progressive code reveal — all serializable.

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

const FLEX_CSS = `.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.item {
  flex: 1 1 0;
  padding: 12px;
}

/* Change a single property and the whole
   layout responds — try it live. */`

function slide(init: Partial<Slide> & Pick<Slide, 'name' | 'layers'>): Slide {
  return {
    id: uid('slide'),
    background: '#0b0b12',
    transition: { type: 'morph', durationMs: 700, easing: 'easeInOut' },
    notes: '',
    ...init,
  }
}

const heading = (text: string, animate = false) =>
  layer({
    type: 'heading',
    name: 'Title',
    morphKey: 'title',
    transform: { x: 80, y: 60, width: 1120, height: 80 },
    style: { fontSize: 48, fontWeight: 800, color: '#ffffff' },
    data: { text },
    animations: animate ? [entrance('slide-in')] : [],
  })

const demo = (data: Record<string, unknown>) =>
  layer({
    type: 'flex-demo',
    name: 'Flexbox',
    morphKey: 'demo',
    transform: { x: 80, y: 170, width: 1120, height: 470 },
    data,
  })

export function createSampleProject(): Project {
  const now = new Date().toISOString()

  const slides: Slide[] = [
    // 1 — Title
    slide({
      name: 'Title',
      layers: [
        layer({
          type: 'shape',
          name: 'Accent',
          morphKey: 'accent',
          transform: { x: 120, y: 140, width: 240, height: 240 },
          style: { fill: '#7c3aed', borderRadius: 48 },
        }),
        layer({
          type: 'heading',
          name: 'Title',
          morphKey: 'title',
          transform: { x: 120, y: 400, width: 900, height: 100 },
          style: { fontSize: 72, fontWeight: 800, color: '#ffffff' },
          data: { text: 'CSS Flexbox' },
          animations: [entrance('slide-in')],
        }),
        layer({
          type: 'text',
          name: 'Subtitle',
          morphKey: 'subtitle',
          transform: { x: 122, y: 520, width: 760, height: 50 },
          style: { fontSize: 26, color: '#a1a1aa' },
          data: { text: 'An interactive guide — change it live while presenting' },
          animations: [entrance('fade-in', 250)],
        }),
      ],
    }),

    // 2 — The container (live demo)
    slide({
      name: 'The container',
      layers: [
        heading('display: flex'),
        demo({ items: 4, direction: 'row', justify: 'flex-start', align: 'stretch', gap: 12 }),
      ],
    }),

    // 3 — justify / align (demo morphs position, new defaults)
    slide({
      name: 'Alignment',
      layers: [
        heading('justify-content & align-items'),
        demo({ items: 5, direction: 'row', justify: 'space-between', align: 'center', gap: 16 }),
      ],
    }),

    // 4 — The CSS (progressive code reveal)
    slide({
      name: 'The CSS',
      layers: [
        heading('The CSS behind it'),
        layer({
          type: 'code',
          name: 'Flex CSS',
          morphKey: 'democode',
          transform: { x: 80, y: 170, width: 1120, height: 470 },
          data: {
            code: FLEX_CSS,
            language: 'css',
            showLineNumbers: true,
            visibleRange: [1, 9],
            focusLines: [3, 4, 5],
          },
        }),
      ],
    }),

    // 5 — Outro
    slide({
      name: 'Outro',
      layers: [
        layer({
          type: 'shape',
          name: 'Accent',
          morphKey: 'accent',
          transform: { x: 520, y: 120, width: 240, height: 240 },
          style: { fill: '#06b6d4', borderRadius: 120 },
        }),
        layer({
          type: 'heading',
          name: 'Title',
          morphKey: 'title',
          transform: { x: 240, y: 420, width: 800, height: 90 },
          style: { fontSize: 56, fontWeight: 800, color: '#ffffff', textAlign: 'center' },
          data: { text: 'Your turn' },
        }),
        layer({
          type: 'button',
          name: 'CTA',
          transform: { x: 560, y: 540, width: 180, height: 56 },
          style: {
            fill: '#7c3aed',
            color: '#ffffff',
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
          },
          data: { label: 'Restart' },
          animations: [attention('pulse')],
          events: [
            {
              id: uid('evt'),
              trigger: 'click',
              actions: [{ type: 'navigate-slide', params: { target: 0 } }],
            },
          ],
        }),
      ],
    }),
  ]

  return {
    id: 'sample',
    name: 'CSS Flexbox — interactive',
    description: 'A live, interactive flexbox lesson with morphing transitions.',
    width: 1280,
    height: 720,
    theme: 'dark',
    slides,
    createdAt: now,
    updatedAt: now,
  }
}

function entrance(presetId: string, delayMs = 0): AnimationInstance {
  return {
    id: uid('anim'),
    presetId,
    trigger: 'slide-enter',
    delayMs,
    durationMs: 600,
    easing: 'easeOut',
    repeat: 0,
  }
}

function attention(presetId: string): AnimationInstance {
  return {
    id: uid('anim'),
    presetId,
    trigger: 'slide-enter',
    delayMs: 600,
    durationMs: 700,
    easing: 'easeInOut',
    repeat: 2,
  }
}
