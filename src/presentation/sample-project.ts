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

function slide(name: string, layers: Layer[]): Slide {
  return {
    id: uid('slide'),
    name,
    background: '#fafafa',
    transition: { type: 'morph', durationMs: 800, easing: 'easeInOut' },
    notes: '',
    layers,
  }
}

export function createSampleProject(): Project {
  const now = new Date().toISOString()

  const slides: Slide[] = [
    // Slide 1: 2D Flexbox Layout Auto-Flow
    slide('1. Flexbox Align', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 60 },
        style: { fontSize: 36, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Layout: Flexbox Auto-Flow' },
      }),
      layer({
        type: 'text',
        name: 'Subtitle',
        morphKey: 'subtitle',
        transform: { x: 80, y: 105, width: 1120, height: 30 },
        style: { fontSize: 15, color: '#64748b' },
        data: { text: 'Flex items adjust along the main axis. Click boxes or buttons to morph structures.' },
      }),
      layer({
        type: 'shape',
        name: 'Container Box',
        morphKey: 'container-box',
        transform: { x: 660, y: 160, width: 540, height: 460 },
        style: { fill: '#faf5ff', borderRadius: 24, borderColor: '#a855f7', borderWidth: 2 },
      }),
      layer({
        type: 'shape',
        name: 'Server Card',
        morphKey: 'card-server',
        transform: { x: 690, y: 220, width: 220, height: 160 },
        style: { fill: '#2563eb', borderRadius: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'Client Card',
        morphKey: 'card-client',
        transform: { x: 950, y: 220, width: 220, height: 160 },
        style: { fill: '#10b981', borderRadius: 16, boxShadow: '0 4px 12px rgba(16,185,129,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'DB Card',
        morphKey: 'card-db',
        transform: { x: 690, y: 420, width: 220, height: 160 },
        style: { fill: '#f97316', borderRadius: 16, boxShadow: '0 4px 12px rgba(249,115,22,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'API Card',
        morphKey: 'card-api',
        transform: { x: 950, y: 420, width: 220, height: 160 },
        style: { fill: '#ec4899', borderRadius: 16, boxShadow: '0 4px 12px rgba(236,72,153,0.15)' },
      }),
      layer({
        type: 'text',
        name: 'Server Badge',
        morphKey: 'badge-server',
        transform: { x: 710, y: 240, width: 180, height: 30 },
        style: { fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'React Server Action' },
      }),
      layer({
        type: 'text',
        name: 'Client Badge',
        morphKey: 'badge-client',
        transform: { x: 970, y: 240, width: 180, height: 30 },
        style: { fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'Client Hydration Node' },
      }),
      layer({
        type: 'arrow',
        name: 'Client Server Arrow',
        morphKey: 'arrow-client-server',
        transform: { x: 910, y: 300, width: 40, height: 20 },
        style: { color: '#2563eb', borderWidth: 3 },
        data: { bendType: 'curved', startX: 950, startY: 300, endX: 910, endY: 300, text: 'gap: 40px', strokeDash: 'solid', sloppiness: 1 },
      }),
      layer({
        type: 'arrow',
        name: 'Server DB Arrow',
        morphKey: 'arrow-server-db',
        transform: { x: 800, y: 380, width: 20, height: 40 },
        style: { color: '#f97316', borderWidth: 3 },
        data: { bendType: 'corner', startX: 800, startY: 380, endX: 800, endY: 420, text: 'db-flow', strokeDash: 'dashed', sloppiness: 2 },
      }),
      layer({
        type: 'arrow',
        name: 'API DB Arrow',
        morphKey: 'arrow-api-db',
        transform: { x: 910, y: 500, width: 40, height: 20 },
        style: { color: '#ec4899', borderWidth: 3 },
        data: { bendType: 'straight', startX: 950, startY: 500, endX: 910, endY: 500, text: 'sync', strokeDash: 'dotted', sloppiness: 1 },
      }),
      layer({
        type: 'code',
        name: 'CSS Code',
        morphKey: 'code-editor',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `.flex-container {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: space-between;\n  gap: 40px;\n}`,
          language: 'css',
          theme: 'dracula',
          showLineNumbers: true,
          focusLines: [2, 3, 5],
        },
      }),
      layer({
        type: 'button',
        name: 'Next Trigger Button',
        morphKey: 'next-trigger-btn',
        transform: { x: 260, y: 640, width: 180, height: 50 },
        style: { fill: '#7c3aed', color: '#ffffff', borderRadius: 12, fontSize: 14, fontWeight: 700 },
        data: { label: 'Go to CSS Grid ➡️' },
        events: [
          {
            id: uid('evt'),
            trigger: 'click',
            actions: [{ type: 'navigate-slide', params: { target: 1 } }],
          },
        ],
      }),
    ]),

    // Slide 2: 2D Grid Matrix Layout Space
    slide('2. Grid Columns', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 60 },
        style: { fontSize: 36, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Layout: Grid Asymmetric Space' },
      }),
      layer({
        type: 'text',
        name: 'Subtitle',
        morphKey: 'subtitle',
        transform: { x: 80, y: 105, width: 1120, height: 30 },
        style: { fontSize: 15, color: '#64748b' },
        data: { text: 'Grid cells align perfectly in rows & columns, forming flexible layout templates.' },
      }),
      layer({
        type: 'shape',
        name: 'Container Box',
        morphKey: 'container-box',
        transform: { x: 660, y: 160, width: 540, height: 460 },
        style: { fill: '#f0fdf4', borderRadius: 24, borderColor: '#22c55e', borderWidth: 2 },
      }),
      layer({
        type: 'shape',
        name: 'Server Card',
        morphKey: 'card-server',
        transform: { x: 690, y: 190, width: 480, height: 110 },
        style: { fill: '#2563eb', borderRadius: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'Client Card',
        morphKey: 'card-client',
        transform: { x: 690, y: 320, width: 140, height: 270 },
        style: { fill: '#10b981', borderRadius: 16, boxShadow: '0 4px 12px rgba(16,185,129,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'DB Card',
        morphKey: 'card-db',
        transform: { x: 860, y: 320, width: 140, height: 270 },
        style: { fill: '#f97316', borderRadius: 16, boxShadow: '0 4px 12px rgba(249,115,22,0.15)' },
      }),
      layer({
        type: 'shape',
        name: 'API Card',
        morphKey: 'card-api',
        transform: { x: 1030, y: 320, width: 140, height: 270 },
        style: { fill: '#ec4899', borderRadius: 16, boxShadow: '0 4px 12px rgba(236,72,153,0.15)' },
      }),
      layer({
        type: 'text',
        name: 'Server Badge',
        morphKey: 'badge-server',
        transform: { x: 710, y: 210, width: 180, height: 30 },
        style: { fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'React Server Action' },
      }),
      layer({
        type: 'text',
        name: 'Client Badge',
        morphKey: 'badge-client',
        transform: { x: 700, y: 340, width: 120, height: 30 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'Client Node' },
      }),
      layer({
        type: 'arrow',
        name: 'Client Server Arrow',
        morphKey: 'arrow-client-server',
        transform: { x: 760, y: 300, width: 20, height: 20 },
        style: { color: '#2563eb', borderWidth: 3 },
        data: { bendType: 'curved', startX: 760, startY: 320, endX: 760, endY: 300, text: 'row-gap', strokeDash: 'solid', sloppiness: 1 },
      }),
      layer({
        type: 'arrow',
        name: 'Server DB Arrow',
        morphKey: 'arrow-server-db',
        transform: { x: 830, y: 455, width: 30, height: 20 },
        style: { color: '#f97316', borderWidth: 3 },
        data: { bendType: 'corner', startX: 830, startY: 455, endX: 860, endY: 455, text: 'col-gap', strokeDash: 'dashed', sloppiness: 2 },
      }),
      layer({
        type: 'arrow',
        name: 'API DB Arrow',
        morphKey: 'arrow-api-db',
        transform: { x: 1000, y: 455, width: 30, height: 20 },
        style: { color: '#ec4899', borderWidth: 3 },
        data: { bendType: 'straight', startX: 1030, startY: 455, endX: 1000, endY: 455, text: 'sync', strokeDash: 'dotted', sloppiness: 1 },
      }),
      layer({
        type: 'code',
        name: 'CSS Code',
        morphKey: 'code-editor',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `.grid-container {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  grid-template-rows: auto 1fr;\n  gap: 20px 30px;\n}`,
          language: 'css',
          theme: 'dracula',
          showLineNumbers: true,
          focusLines: [2, 3, 4, 5],
        },
      }),
      layer({
        type: 'button',
        name: 'Next Trigger Button',
        morphKey: 'next-trigger-btn',
        transform: { x: 260, y: 640, width: 180, height: 50 },
        style: { fill: '#7c3aed', color: '#ffffff', borderRadius: 12, fontSize: 14, fontWeight: 700 },
        data: { label: 'Go to 3D Space 🚀' },
        events: [
          {
            id: uid('evt'),
            trigger: 'click',
            actions: [{ type: 'navigate-slide', params: { target: 2 } }],
          },
        ],
      }),
    ]),

    // Slide 3: 3D Perspective Isometric Projection space!
    slide('3. 3D Isometric View', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 60 },
        style: { fontSize: 36, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Layout: 3D Perspective Space' },
      }),
      layer({
        type: 'text',
        name: 'Subtitle',
        morphKey: 'subtitle',
        transform: { x: 80, y: 105, width: 1120, height: 30 },
        style: { fontSize: 15, color: '#64748b' },
        data: { text: '3D perspective & Z-axis height configurations raise and tilt components dynamically.' },
      }),
      layer({
        type: 'shape',
        name: 'Container Box',
        morphKey: 'container-box',
        transform: { x: 660, y: 160, width: 540, height: 460 },
        style: { fill: '#fff5f5', borderRadius: 24, borderColor: '#f87171', borderWidth: 2, boxShadow: '15px 25px 60px rgba(0,0,0,0.18)' },
        data: { perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 0 },
      }),
      layer({
        type: 'shape',
        name: 'Server Card',
        morphKey: 'card-server',
        transform: { x: 690, y: 190, width: 480, height: 110 },
        style: { fill: '#2563eb', borderRadius: 16, boxShadow: '8px 12px 24px rgba(37,99,235,0.3)' },
        data: { perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 50 },
      }),
      layer({
        type: 'shape',
        name: 'Client Card',
        morphKey: 'card-client',
        transform: { x: 690, y: 320, width: 140, height: 270 },
        style: { fill: '#10b981', borderRadius: 16, boxShadow: '12px 18px 36px rgba(16,185,129,0.35)' },
        data: { perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 100 },
      }),
      layer({
        type: 'shape',
        name: 'DB Card',
        morphKey: 'card-db',
        transform: { x: 860, y: 320, width: 140, height: 270 },
        style: { fill: '#f97316', borderRadius: 16, boxShadow: '16px 24px 48px rgba(249,115,22,0.4)' },
        data: { perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 150 },
      }),
      layer({
        type: 'shape',
        name: 'API Card',
        morphKey: 'card-api',
        transform: { x: 1030, y: 320, width: 140, height: 270 },
        style: { fill: '#ec4899', borderRadius: 16, boxShadow: '20px 30px 60px rgba(236,72,153,0.45)' },
        data: { perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 200 },
      }),
      layer({
        type: 'text',
        name: 'Server Badge',
        morphKey: 'badge-server',
        transform: { x: 710, y: 210, width: 180, height: 30 },
        style: { fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'React Server Action', perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 65 },
      }),
      layer({
        type: 'text',
        name: 'Client Badge',
        morphKey: 'badge-client',
        transform: { x: 700, y: 340, width: 120, height: 30 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: 'Client Node', perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 115 },
      }),
      layer({
        type: 'arrow',
        name: 'Client Server Arrow',
        morphKey: 'arrow-client-server',
        transform: { x: 760, y: 300, width: 20, height: 20 },
        style: { color: '#2563eb', borderWidth: 3.5 },
        data: { bendType: 'curved', startX: 760, startY: 320, endX: 760, endY: 300, text: 'Z-Axis Gap', strokeDash: 'solid', sloppiness: 1, perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 80 },
      }),
      layer({
        type: 'arrow',
        name: 'Server DB Arrow',
        morphKey: 'arrow-server-db',
        transform: { x: 830, y: 455, width: 30, height: 20 },
        style: { color: '#f97316', borderWidth: 3.5 },
        data: { bendType: 'corner', startX: 830, startY: 455, endX: 860, endY: 455, text: 'Z-Depth Gap', strokeDash: 'dashed', sloppiness: 2, perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 120 },
      }),
      layer({
        type: 'arrow',
        name: 'API DB Arrow',
        morphKey: 'arrow-api-db',
        transform: { x: 1000, y: 455, width: 30, height: 20 },
        style: { color: '#ec4899', borderWidth: 3.5 },
        data: { bendType: 'straight', startX: 1030, startY: 455, endX: 1000, endY: 455, text: 'sync', strokeDash: 'dotted', sloppiness: 1, perspective: 1000, rotateX: 55, rotateY: -5, rotateZ: -30, translateZ: 180 },
      }),
      layer({
        type: 'code',
        name: 'CSS Code',
        morphKey: 'code-editor',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        style: { boxShadow: '10px 15px 30px rgba(0,0,0,0.2)' },
        data: {
          code: `.isometric-space {\n  transform:\n    perspective(1000px)\n    rotateX(55deg)\n    rotateZ(-30deg);\n}\n\n.card-server {\n  transform: translateZ(50px);\n}\n.card-client {\n  transform: translateZ(100px);\n}\n.card-db {\n  transform: translateZ(150px);\n}\n.card-api {\n  transform: translateZ(200px);\n}`,
          language: 'css',
          theme: 'dracula',
          showLineNumbers: true,
          focusLines: [2, 3, 4, 5, 8, 9, 11, 12, 14, 15, 17, 18],
          perspective: 1000,
          rotateX: 25,
          rotateY: 15,
          translateZ: 30
        },
      }),
      layer({
        type: 'button',
        name: 'Next Trigger Button',
        morphKey: 'next-trigger-btn',
        transform: { x: 260, y: 640, width: 180, height: 50 },
        style: { fill: '#7c3aed', color: '#ffffff', borderRadius: 12, fontSize: 14, fontWeight: 700 },
        data: { label: 'Restart Presentation 🔄' },
        events: [
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
    name: 'CSS 3D Engine Layout Visualizer',
    description: 'Highly visual presentation of flat Flexbox/Grid layouts morphing smoothly into an isometric 3D perspective projection space.',
    width: 1280,
    height: 720,
    theme: 'light',
    slides,
    createdAt: now,
    updatedAt: now,
  }
}
