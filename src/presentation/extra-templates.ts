import { defaultTransform, uid } from './doc'
import type { Layer, Project, Slide, AnimationInstance, EventBinding, Transform } from './types'

function layer(init: {
  type: string
  name: string
  morphKey?: string
  transform: Partial<Transform>
  style?: any
  data?: Record<string, unknown>
  animations?: AnimationInstance[]
  events?: EventBinding[]
  hidden?: boolean
}): Layer {
  return {
    id: uid('layer'),
    type: init.type,
    name: init.name,
    morphKey: init.morphKey,
    transform: defaultTransform(init.transform),
    style: (init.style as Layer['style']) ?? {},
    locked: false,
    hidden: init.hidden ?? false,
    data: init.data ?? {},
    animations: init.animations ?? [],
    events: init.events ?? [],
  }
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

function project(name: string, slides: Slide[]): Project {
  const now = new Date().toISOString()
  return {
    id: uid('project'),
    name,
    description: 'Interactive educational template',
    width: 1280,
    height: 720,
    theme: 'light',
    slides,
    createdAt: now,
    updatedAt: now,
  }
}


// ---------------------------------------------------------------------------
// 1. Redux Flow Visualizer Template
// ---------------------------------------------------------------------------
export function reduxFlowProject(): Project {
  return project('React/Redux State Flow', [
    slide('1. Dispatch Action', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: '1. React Component Dispatches Action' },
      }),
      layer({
        type: 'code',
        name: 'React Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `function Counter() {\n  const dispatch = useDispatch()\n\n  return (\n    <button onClick={() => \n      dispatch({ \n        type: 'INCREMENT', \n        payload: 1 \n      })\n    }>\n      Increment\n    </button>\n  )\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [5, 6, 7, 8, 9],
        },
      }),
      // Visual Components
      layer({
        type: 'shape',
        name: 'React Component',
        morphKey: 'react-comp',
        transform: { x: 700, y: 180, width: 440, height: 100 },
        style: { fill: '#ecfeff', borderRadius: 16, borderColor: '#0891b2', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'React Label',
        morphKey: 'react-label',
        transform: { x: 720, y: 215, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#0891b2', textAlign: 'center' },
        data: { text: 'React Component' },
      }),
      layer({
        type: 'shape',
        name: 'Reducer Box',
        morphKey: 'reducer',
        transform: { x: 700, y: 340, width: 440, height: 100 },
        style: { fill: '#faf5ff', borderRadius: 16, borderColor: '#7e22ce', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Reducer Label',
        morphKey: 'reducer-label',
        transform: { x: 720, y: 375, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#7e22ce', textAlign: 'center' },
        data: { text: 'Reducer function' },
      }),
      layer({
        type: 'shape',
        name: 'Action Bubble',
        morphKey: 'action-bubble',
        transform: { x: 800, y: 245, width: 240, height: 32 },
        style: { fill: '#dbeafe', borderRadius: 8, borderColor: '#2563eb', borderWidth: 1.5 },
      }),
      layer({
        type: 'text',
        name: 'Action Text',
        morphKey: 'action-text',
        transform: { x: 800, y: 251, width: 240, height: 20 },
        style: { fontSize: 11, fontWeight: 600, color: '#1e40af', textAlign: 'center', fontFamily: 'var(--font-mono)' },
        data: { text: "{ type: 'INCREMENT' }" },
      }),
      layer({
        type: 'shape',
        name: 'Store Box',
        morphKey: 'store',
        transform: { x: 700, y: 500, width: 440, height: 120 },
        style: { fill: '#f0fdf4', borderRadius: 16, borderColor: '#15803d', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Store Label',
        morphKey: 'store-label',
        transform: { x: 720, y: 520, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#15803d', textAlign: 'center' },
        data: { text: 'Redux Store (State: count = 0)' },
      }),
    ]),
    slide('2. Reducer Evaluates', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: '2. Reducer Receives & Evaluates Action' },
      }),
      layer({
        type: 'code',
        name: 'Reducer Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `function counterReducer(state = { count: 0 }, action) {\n  switch (action.type) {\n    case 'INCREMENT':\n      return {\n        ...state,\n        count: state.count + 1\n      }\n    default:\n      return state\n  }\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [3, 4, 5, 6, 7],
        },
      }),
      // Visual Components
      layer({
        type: 'shape',
        name: 'React Component',
        morphKey: 'react-comp',
        transform: { x: 700, y: 180, width: 440, height: 100 },
        style: { fill: '#ecfeff', borderRadius: 16, borderColor: '#0891b2', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'React Label',
        morphKey: 'react-label',
        transform: { x: 720, y: 215, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#0891b2', textAlign: 'center' },
        data: { text: 'React Component' },
      }),
      layer({
        type: 'shape',
        name: 'Reducer Box',
        morphKey: 'reducer',
        transform: { x: 700, y: 340, width: 440, height: 100 },
        style: { fill: '#fae8ff', borderRadius: 16, borderColor: '#a855f7', borderWidth: 3 }, // Highlighted border
      }),
      layer({
        type: 'text',
        name: 'Reducer Label',
        morphKey: 'reducer-label',
        transform: { x: 720, y: 375, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#a855f7', textAlign: 'center' },
        data: { text: 'Reducer function processing...' },
      }),
      layer({
        type: 'shape',
        name: 'Action Bubble',
        morphKey: 'action-bubble',
        transform: { x: 800, y: 374, width: 240, height: 32 }, // Morphed down into reducer
        style: { fill: '#f3e8ff', borderRadius: 8, borderColor: '#c084fc', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Action Text',
        morphKey: 'action-text',
        transform: { x: 800, y: 380, width: 240, height: 20 },
        style: { fontSize: 11, fontWeight: 600, color: '#7e22ce', textAlign: 'center', fontFamily: 'var(--font-mono)' },
        data: { text: "{ type: 'INCREMENT' }" },
      }),
      layer({
        type: 'shape',
        name: 'Store Box',
        morphKey: 'store',
        transform: { x: 700, y: 500, width: 440, height: 120 },
        style: { fill: '#f0fdf4', borderRadius: 16, borderColor: '#15803d', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Store Label',
        morphKey: 'store-label',
        transform: { x: 720, y: 520, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#15803d', textAlign: 'center' },
        data: { text: 'Redux Store (State: count = 0)' },
      }),
    ]),
    slide('3. Store State Updates', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: '3. Store State Updates & Component Re-renders' },
      }),
      layer({
        type: 'code',
        name: 'State Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `// Redux Global State\n{\n  counter: {\n    count: 1 // State updated!\n  },\n  auth: {\n    isLoggedIn: false\n  }\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [3, 4, 5],
          codeAnimation: { type: 'fadeIn', durationMs: 500 }
        },
      }),
      // Visual Components
      layer({
        type: 'shape',
        name: 'React Component',
        morphKey: 'react-comp',
        transform: { x: 700, y: 180, width: 440, height: 100 },
        style: { fill: '#cffafe', borderRadius: 16, borderColor: '#06b6d4', borderWidth: 3 }, // Highlighted Cyan re-render
      }),
      layer({
        type: 'text',
        name: 'React Label',
        morphKey: 'react-label',
        transform: { x: 720, y: 215, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#06b6d4', textAlign: 'center' },
        data: { text: 'React Component Re-renders with 1!' },
      }),
      layer({
        type: 'shape',
        name: 'Reducer Box',
        morphKey: 'reducer',
        transform: { x: 700, y: 340, width: 440, height: 100 },
        style: { fill: '#faf5ff', borderRadius: 16, borderColor: '#7e22ce', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Reducer Label',
        morphKey: 'reducer-label',
        transform: { x: 720, y: 375, width: 400, height: 30 },
        style: { fontSize: 20, fontWeight: 700, color: '#7e22ce', textAlign: 'center' },
        data: { text: 'Reducer idle' },
      }),
      layer({
        type: 'shape',
        name: 'Store Box',
        morphKey: 'store',
        transform: { x: 700, y: 500, width: 440, height: 120 },
        style: { fill: '#dcfce7', borderRadius: 16, borderColor: '#22c55e', borderWidth: 3 }, // Lit up store
      }),
      layer({
        type: 'text',
        name: 'Store Label',
        morphKey: 'store-label',
        transform: { x: 720, y: 520, width: 400, height: 30 },
        style: { fontSize: 22, fontWeight: 800, color: '#16a34a', textAlign: 'center' },
        data: { text: 'Redux Store (State: count = 1)' }, // Value changed
      }),
    ]),
  ])
}

// ---------------------------------------------------------------------------
// 2. CSS Grid Layout Morphing Template
// ---------------------------------------------------------------------------
export function cssGridProject(): Project {
  const boxStyle = { fill: '#6366f1', borderRadius: 12 }
  const renderGridItems = (items: { x: number; y: number; w: number; h: number }[]) => {
    return items.map((itm, i) =>
      layer({
        type: 'shape',
        name: `Grid Item ${i + 1}`,
        morphKey: `g-item-${i + 1}`,
        transform: { x: itm.x, y: itm.y, width: itm.w, height: itm.h },
        style: boxStyle,
      })
    )
  }

  const GRID_1 = [
    { x: 700, y: 200, w: 125, h: 100 },
    { x: 845, y: 200, w: 125, h: 100 },
    { x: 990, y: 200, w: 125, h: 100 },
    { x: 700, y: 320, w: 125, h: 100 },
    { x: 845, y: 320, w: 125, h: 100 },
    { x: 990, y: 320, w: 125, h: 100 },
  ]

  const GRID_2 = [
    { x: 700, y: 200, w: 90, h: 100 },
    { x: 810, y: 200, w: 200, h: 100 }, // Middle column twice as wide
    { x: 1030, y: 200, w: 90, h: 100 },
    { x: 700, y: 320, w: 90, h: 100 },
    { x: 810, y: 320, w: 200, h: 100 },
    { x: 1030, y: 320, w: 90, h: 100 },
  ]

  const GRID_3 = [
    { x: 700, y: 200, w: 205, h: 100 }, // Arranged in columns of 2
    { x: 925, y: 200, w: 205, h: 100 },
    { x: 700, y: 320, w: 205, h: 100 },
    { x: 925, y: 320, w: 205, h: 100 },
    { x: 700, y: 440, w: 205, h: 100 },
    { x: 925, y: 440, w: 205, h: 100 },
  ]

  return project('CSS Grid Layout Morphing', [
    slide('Columns repeat(3, 1fr)', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Grid: repeat(3, 1fr) Columns' },
      }),
      layer({
        type: 'code',
        name: 'Grid CSS',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 20px;\n}`,
          language: 'css',
          showLineNumbers: true,
          focusLines: [3],
        },
      }),
      layer({
        type: 'shape',
        name: 'Grid Frame',
        morphKey: 'frame',
        transform: { x: 670, y: 160, width: 480, height: 460 },
        style: { fill: '#fafafa', borderRadius: 20, borderColor: '#e2e8f0', borderWidth: 2 },
      }),
      ...renderGridItems(GRID_1),
    ]),
    slide('Columns 1fr 2fr 1fr', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Grid: Asymmetric Columns' },
      }),
      layer({
        type: 'code',
        name: 'Grid CSS',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `.grid-container {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  gap: 20px;\n}`,
          language: 'css',
          showLineNumbers: true,
          focusLines: [3],
          codeAnimation: { type: 'smooth', durationMs: 500 }
        },
      }),
      layer({
        type: 'shape',
        name: 'Grid Frame',
        morphKey: 'frame',
        transform: { x: 670, y: 160, width: 480, height: 460 },
        style: { fill: '#fafafa', borderRadius: 20, borderColor: '#e2e8f0', borderWidth: 2 },
      }),
      ...renderGridItems(GRID_2),
    ]),
    slide('Columns repeat(2, 1fr)', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'CSS Grid: repeat(2, 1fr) Columns' },
      }),
      layer({
        type: 'code',
        name: 'Grid CSS',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 20px;\n}`,
          language: 'css',
          showLineNumbers: true,
          focusLines: [3],
          codeAnimation: { type: 'smooth', durationMs: 500 }
        },
      }),
      layer({
        type: 'shape',
        name: 'Grid Frame',
        morphKey: 'frame',
        transform: { x: 670, y: 160, width: 480, height: 460 },
        style: { fill: '#fafafa', borderRadius: 20, borderColor: '#e2e8f0', borderWidth: 2 },
      }),
      ...renderGridItems(GRID_3),
    ]),
  ])
}

// ---------------------------------------------------------------------------
// 3. Binary Search Tree Insertion Visualizer Template
// ---------------------------------------------------------------------------
export function bstProject(): Project {
  const nStyle = { fill: '#f8fafc', borderRadius: 24, borderColor: '#64748b', borderWidth: 2 }
  const labelStyle = { fontSize: 18, fontWeight: 700, color: '#334155', textAlign: 'center' }

  return project('Binary Search Tree Insertion', [
    slide('1. Compare with Root (8)', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'BST Insert(5): Compare at Root (8)' },
      }),
      layer({
        type: 'code',
        name: 'BST Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `function insert(root, val) {\n  if (!root) return new Node(val)\n\n  if (val < root.val) {\n    root.left = insert(root.left, val)\n  } else {\n    root.right = insert(root.right, val)\n  }\n  return root\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [4, 5],
        },
      }),
      layer({
        type: 'shape',
        name: 'Root Node',
        morphKey: 'node-8',
        transform: { x: 900, y: 180, width: 60, height: 60 },
        style: { fill: '#fef08a', borderRadius: 30, borderColor: '#eab308', borderWidth: 3 }, // Highlighted comparison root
      }),
      layer({
        type: 'text',
        name: 'Root Lbl',
        morphKey: 'lbl-8',
        transform: { x: 900, y: 198, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '8' },
      }),
      layer({
        type: 'shape',
        name: 'Left Child',
        morphKey: 'node-3',
        transform: { x: 780, y: 300, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Left Lbl',
        morphKey: 'lbl-3',
        transform: { x: 780, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '3' },
      }),
      layer({
        type: 'shape',
        name: 'Right Child',
        morphKey: 'node-10',
        transform: { x: 1020, y: 300, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Right Lbl',
        morphKey: 'lbl-10',
        transform: { x: 1020, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '10' },
      }),
      // Inserting Node
      layer({
        type: 'shape',
        name: 'Insert Node',
        morphKey: 'insert-node',
        transform: { x: 670, y: 180, width: 60, height: 60 },
        style: { fill: '#bbf7d0', borderRadius: 30, borderColor: '#22c55e', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Insert Lbl',
        morphKey: 'insert-lbl',
        transform: { x: 670, y: 198, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '5' },
      }),
    ]),
    slide('2. Go Left & Compare with 3', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'BST Insert(5): 5 < 8, go left. Compare with 3' },
      }),
      layer({
        type: 'code',
        name: 'BST Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `function insert(root, val) {\n  if (!root) return new Node(val)\n\n  if (val < root.val) {\n    root.left = insert(root.left, val)\n  } else {\n    root.right = insert(root.right, val)\n  }\n  return root\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [6, 7],
          codeAnimation: { type: 'smooth', durationMs: 400 }
        },
      }),
      layer({
        type: 'shape',
        name: 'Root Node',
        morphKey: 'node-8',
        transform: { x: 900, y: 180, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Root Lbl',
        morphKey: 'lbl-8',
        transform: { x: 900, y: 198, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '8' },
      }),
      layer({
        type: 'shape',
        name: 'Left Child',
        morphKey: 'node-3',
        transform: { x: 780, y: 300, width: 60, height: 60 },
        style: { fill: '#fef08a', borderRadius: 30, borderColor: '#eab308', borderWidth: 3 }, // Highlighted 3 comparison
      }),
      layer({
        type: 'text',
        name: 'Left Lbl',
        morphKey: 'lbl-3',
        transform: { x: 780, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '3' },
      }),
      layer({
        type: 'shape',
        name: 'Right Child',
        morphKey: 'node-10',
        transform: { x: 1020, y: 300, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Right Lbl',
        morphKey: 'lbl-10',
        transform: { x: 1020, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '10' },
      }),
      // Inserting Node
      layer({
        type: 'shape',
        name: 'Insert Node',
        morphKey: 'insert-node',
        transform: { x: 780, y: 180, width: 60, height: 60 }, // Moving down path
        style: { fill: '#bbf7d0', borderRadius: 30, borderColor: '#22c55e', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Insert Lbl',
        morphKey: 'insert-lbl',
        transform: { x: 780, y: 198, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '5' },
      }),
    ]),
    slide('3. Insert as Right Child of 3', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'BST Insert(5): 5 > 3, insert as right child!' },
      }),
      layer({
        type: 'code',
        name: 'BST Code',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `function insert(root, val) {\n  if (!root) return new Node(val) // Hit base case!\n\n  if (val < root.val) {\n    root.left = insert(root.left, val)\n  } else {\n    root.right = insert(root.right, val)\n  }\n  return root\n}`,
          language: 'typescript',
          showLineNumbers: true,
          focusLines: [2],
          codeAnimation: { type: 'smooth', durationMs: 400 }
        },
      }),
      layer({
        type: 'shape',
        name: 'Root Node',
        morphKey: 'node-8',
        transform: { x: 900, y: 180, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Root Lbl',
        morphKey: 'lbl-8',
        transform: { x: 900, y: 198, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '8' },
      }),
      layer({
        type: 'shape',
        name: 'Left Child',
        morphKey: 'node-3',
        transform: { x: 780, y: 300, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Left Lbl',
        morphKey: 'lbl-3',
        transform: { x: 780, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '3' },
      }),
      layer({
        type: 'shape',
        name: 'Right Child',
        morphKey: 'node-10',
        transform: { x: 1020, y: 300, width: 60, height: 60 },
        style: nStyle,
      }),
      layer({
        type: 'text',
        name: 'Right Lbl',
        morphKey: 'lbl-10',
        transform: { x: 1020, y: 318, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '10' },
      }),
      // Inserting Node - Settles as right child of 3 (x: 840, y: 400)
      layer({
        type: 'shape',
        name: 'Insert Node',
        morphKey: 'insert-node',
        transform: { x: 840, y: 400, width: 60, height: 60 }, // Inserted successfully!
        style: { fill: '#bbf7d0', borderRadius: 30, borderColor: '#22c55e', borderWidth: 3 },
      }),
      layer({
        type: 'text',
        name: 'Insert Lbl',
        morphKey: 'insert-lbl',
        transform: { x: 840, y: 418, width: 60, height: 24 },
        style: labelStyle,
        data: { text: '5' },
      }),
    ]),
  ])
}

// ---------------------------------------------------------------------------
// 4. Git Rebase Visualizer Template
// ---------------------------------------------------------------------------
export function gitProject(): Project {
  const commitStyle = { fill: '#cbd5e1', borderRadius: 16, borderColor: '#475569', borderWidth: 2 }
  const featStyle = { fill: '#fed7aa', borderRadius: 16, borderColor: '#ea580c', borderWidth: 2 }
  const lblStyle = { fontSize: 11, fontWeight: 700, color: '#334155', textAlign: 'center', fontFamily: 'var(--font-mono)' }

  return project('Git Rebase Flow Visualizer', [
    slide('1. Diverged Branches', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Git Rebase: Diverged Master and Feature' },
      }),
      layer({
        type: 'code',
        name: 'Git terminal',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `$ git log --oneline --graph\n* c8e2f1 (feature) Commit F2\n* a7b3d4 Commit F1\n| * 9d8b7c (master) Commit C3\n|/\n* 4b2a8d Commit C2\n* 1e3f5a Commit C1`,
          language: 'bash',
          showLineNumbers: false,
        },
      }),
      // Master Commits
      layer({
        type: 'shape',
        name: 'C1',
        morphKey: 'commit-c1',
        transform: { x: 700, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C1 Lbl',
        morphKey: 'lbl-c1',
        transform: { x: 700, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C1' },
      }),
      layer({
        type: 'shape',
        name: 'C2',
        morphKey: 'commit-c2',
        transform: { x: 800, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C2 Lbl',
        morphKey: 'lbl-c2',
        transform: { x: 800, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C2' },
      }),
      layer({
        type: 'shape',
        name: 'C3',
        morphKey: 'commit-c3',
        transform: { x: 900, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C3 Lbl',
        morphKey: 'lbl-c3',
        transform: { x: 900, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C3 (Master)' },
      }),
      // Feature Commits branching off C2
      layer({
        type: 'shape',
        name: 'F1',
        morphKey: 'commit-f1',
        transform: { x: 900, y: 220, width: 50, height: 50 },
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F1 Lbl',
        morphKey: 'lbl-f1',
        transform: { x: 900, y: 236, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'F1' },
      }),
      layer({
        type: 'shape',
        name: 'F2',
        morphKey: 'commit-f2',
        transform: { x: 1000, y: 220, width: 50, height: 50 },
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F2 Lbl',
        morphKey: 'lbl-f2',
        transform: { x: 1000, y: 236, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'F2 (Feat)' },
      }),
    ]),
    slide('2. Git Rebase Executing', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Executing git rebase master...' },
      }),
      layer({
        type: 'code',
        name: 'Git terminal',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `$ git checkout feature\n$ git rebase master\n\nFirst, rewinding head to replay your work on top of it...\nApplying: Commit F1\nApplying: Commit F2`,
          language: 'bash',
          showLineNumbers: false,
          codeAnimation: { type: 'typewriter', durationMs: 700 }
        },
      }),
      // Master Commits
      layer({
        type: 'shape',
        name: 'C1',
        morphKey: 'commit-c1',
        transform: { x: 700, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C1 Lbl',
        morphKey: 'lbl-c1',
        transform: { x: 700, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C1' },
      }),
      layer({
        type: 'shape',
        name: 'C2',
        morphKey: 'commit-c2',
        transform: { x: 800, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C2 Lbl',
        morphKey: 'lbl-c2',
        transform: { x: 800, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C2' },
      }),
      layer({
        type: 'shape',
        name: 'C3',
        morphKey: 'commit-c3',
        transform: { x: 900, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C3 Lbl',
        morphKey: 'lbl-c3',
        transform: { x: 900, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C3 (Master)' },
      }),
      // Feature Commits in process of sliding / rebasing
      layer({
        type: 'shape',
        name: 'F1',
        morphKey: 'commit-f1',
        transform: { x: 980, y: 280, width: 50, height: 50 }, // Sliding down
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F1 Lbl',
        morphKey: 'lbl-f1',
        transform: { x: 980, y: 296, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'F1' },
      }),
      layer({
        type: 'shape',
        name: 'F2',
        morphKey: 'commit-f2',
        transform: { x: 1080, y: 280, width: 50, height: 50 },
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F2 Lbl',
        morphKey: 'lbl-f2',
        transform: { x: 1080, y: 296, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'F2' },
      }),
    ]),
    slide('3. Rebased Linear History', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Rebase complete: Sleek Linear Git History!' },
      }),
      layer({
        type: 'code',
        name: 'Git terminal',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `$ git log --oneline --graph\n* 5d2a9f (feature) Commit F2'\n* 8e3c1b Commit F1'\n* 9d8b7c (master) Commit C3\n* 4b2a8d Commit C2\n* 1e3f5a Commit C1`,
          language: 'bash',
          showLineNumbers: false,
          codeAnimation: { type: 'smooth', durationMs: 400 }
        },
      }),
      // Master Commits
      layer({
        type: 'shape',
        name: 'C1',
        morphKey: 'commit-c1',
        transform: { x: 700, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C1 Lbl',
        morphKey: 'lbl-c1',
        transform: { x: 700, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C1' },
      }),
      layer({
        type: 'shape',
        name: 'C2',
        morphKey: 'commit-c2',
        transform: { x: 800, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C2 Lbl',
        morphKey: 'lbl-c2',
        transform: { x: 800, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C2' },
      }),
      layer({
        type: 'shape',
        name: 'C3',
        morphKey: 'commit-c3',
        transform: { x: 900, y: 350, width: 50, height: 50 },
        style: commitStyle,
      }),
      layer({
        type: 'text',
        name: 'C3 Lbl',
        morphKey: 'lbl-c3',
        transform: { x: 900, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: 'C3' },
      }),
      // Feature Commits replayed linearly right of C3
      layer({
        type: 'shape',
        name: 'F1',
        morphKey: 'commit-f1',
        transform: { x: 1000, y: 350, width: 50, height: 50 }, // Fully linear!
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F1 Lbl',
        morphKey: 'lbl-f1',
        transform: { x: 1000, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: "F1'" },
      }),
      layer({
        type: 'shape',
        name: 'F2',
        morphKey: 'commit-f2',
        transform: { x: 1100, y: 350, width: 50, height: 50 },
        style: featStyle,
      }),
      layer({
        type: 'text',
        name: 'F2 Lbl',
        morphKey: 'lbl-f2',
        transform: { x: 1100, y: 366, width: 50, height: 18 },
        style: lblStyle,
        data: { text: "F2' (Feat)" },
      }),
    ]),
  ])
}

// ---------------------------------------------------------------------------
// 5. REST vs GraphQL API Visualizer Template
// ---------------------------------------------------------------------------
export function apiProject(): Project {
  const compStyle = { fill: '#f8fafc', borderRadius: 16, borderColor: '#475569', borderWidth: 2 }
  const lblStyle = { fontSize: 20, fontWeight: 700, color: '#334155', textAlign: 'center' }

  return project('REST vs GraphQL API Flow', [
    slide('REST API Requests', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'REST API: Multiple Overfetching Requests' },
      }),
      layer({
        type: 'code',
        name: 'REST Request',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `// REST requests to load user and posts\nGET /api/users/1\nGET /api/users/1/posts\n\n// Payload includes unused fields:\n{\n  "id": 1,\n  "name": "Alex",\n  "email": "alex@company.com",\n  "created_at": "2023-01-01T00:00:00Z"\n}`,
          language: 'javascript',
          showLineNumbers: true,
          focusLines: [2, 3],
        },
      }),
      layer({
        type: 'shape',
        name: 'Client Box',
        morphKey: 'client',
        transform: { x: 700, y: 180, width: 180, height: 400 },
        style: compStyle,
      }),
      layer({
        type: 'text',
        name: 'Client Label',
        morphKey: 'client-lbl',
        transform: { x: 710, y: 360, width: 160, height: 30 },
        style: lblStyle,
        data: { text: 'Client App' },
      }),
      layer({
        type: 'shape',
        name: 'Server Box',
        morphKey: 'server',
        transform: { x: 1000, y: 180, width: 180, height: 400 },
        style: compStyle,
      }),
      layer({
        type: 'text',
        name: 'Server Label',
        morphKey: 'server-lbl',
        transform: { x: 1010, y: 360, width: 160, height: 30 },
        style: lblStyle,
        data: { text: 'Server' },
      }),
      // Request arrows
      layer({
        type: 'shape',
        name: 'Arrow 1',
        morphKey: 'arrow-req1',
        transform: { x: 860, y: 250, width: 160, height: 24 },
        style: { fill: '#f43f5e', borderRadius: 4 }, // Red for REST req
      }),
      layer({
        type: 'text',
        name: 'Arrow 1 label',
        morphKey: 'arrow-req1-lbl',
        transform: { x: 860, y: 254, width: 160, height: 16 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center', fontFamily: 'var(--font-mono)' },
        data: { text: 'GET /users/1' },
      }),
      layer({
        type: 'shape',
        name: 'Arrow 2',
        morphKey: 'arrow-req2',
        transform: { x: 860, y: 400, width: 160, height: 24 },
        style: { fill: '#f43f5e', borderRadius: 4 },
      }),
      layer({
        type: 'text',
        name: 'Arrow 2 label',
        morphKey: 'arrow-req2-lbl',
        transform: { x: 860, y: 404, width: 160, height: 16 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center', fontFamily: 'var(--font-mono)' },
        data: { text: 'GET /users/1/posts' },
      }),
    ]),
    slide('GraphQL Single Request', [
      layer({
        type: 'heading',
        name: 'Title',
        morphKey: 'title',
        transform: { x: 80, y: 50, width: 1120, height: 70 },
        style: { fontSize: 40, fontWeight: 800, color: '#0f172a' },
        data: { text: 'GraphQL: Single Precise Tailored Request' },
      }),
      layer({
        type: 'code',
        name: 'GraphQL Request',
        morphKey: 'code',
        transform: { x: 80, y: 160, width: 540, height: 460 },
        data: {
          code: `POST /graphql\nquery {\n  user(id: 1) {\n    name\n    posts {\n      title\n    }\n  }\n}`,
          language: 'graphql',
          showLineNumbers: true,
          focusLines: [2, 3, 4, 5, 6, 7, 8],
          codeAnimation: { type: 'smooth', durationMs: 400 }
        },
      }),
      layer({
        type: 'shape',
        name: 'Client Box',
        morphKey: 'client',
        transform: { x: 700, y: 180, width: 180, height: 400 },
        style: compStyle,
      }),
      layer({
        type: 'text',
        name: 'Client Label',
        morphKey: 'client-lbl',
        transform: { x: 710, y: 360, width: 160, height: 30 },
        style: lblStyle,
        data: { text: 'Client App' },
      }),
      layer({
        type: 'shape',
        name: 'Server Box',
        morphKey: 'server',
        transform: { x: 1000, y: 180, width: 180, height: 400 },
        style: compStyle,
      }),
      layer({
        type: 'text',
        name: 'Server Label',
        morphKey: 'server-lbl',
        transform: { x: 1010, y: 360, width: 160, height: 30 },
        style: lblStyle,
        data: { text: 'Server' },
      }),
      // Single Request arrow morphed into one center arrow
      layer({
        type: 'shape',
        name: 'Arrow 1',
        morphKey: 'arrow-req1',
        transform: { x: 860, y: 330, width: 160, height: 32 }, // Combined!
        style: { fill: '#e11d48', borderRadius: 6 }, // Rose red GraphQL
      }),
      layer({
        type: 'text',
        name: 'Arrow 1 label',
        morphKey: 'arrow-req1-lbl',
        transform: { x: 860, y: 338, width: 160, height: 16 },
        style: { fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center', fontFamily: 'var(--font-mono)' },
        data: { text: 'POST /graphql' },
      }),
      // Second arrow fades away by shrinking/hidden
      layer({
        type: 'shape',
        name: 'Arrow 2',
        morphKey: 'arrow-req2',
        transform: { x: 860, y: 330, width: 160, height: 10 },
        style: { fill: '#e11d48', borderRadius: 4 },
        hidden: true,
      }),
      layer({
        type: 'text',
        name: 'Arrow 2 label',
        morphKey: 'arrow-req2-lbl',
        transform: { x: 860, y: 330, width: 160, height: 10 },
        style: { fontSize: 8, color: '#ffffff', textAlign: 'center' },
        hidden: true,
      }),
    ]),
  ])
}

export function nextJsAppRouterProject(): Project {
  const codeFiles = [
    {
      name: 'app/page.tsx',
      language: 'typescript',
      code: `import { Suspense } from 'react'\nimport { Stats, StatsSkeleton } from './stats'\n\nexport default async function Page() {\n  // 1. Fetch server data\n  const data = await fetch('https://api.db/stats', {\n    cache: 'no-store'\n  }).then(res => res.json())\n\n  return (\n    <div className="space-y-6">\n      <h2 className="text-2xl font-bold">Metrics</h2>\n      <Suspense fallback={<StatsSkeleton />}>\n        <Stats initial={data} />\n      </Suspense>\n    </div>\n  )\n}`
    },
    {
      name: 'app/loading.tsx',
      language: 'typescript',
      code: `export default function Loading() {\n  // 2. Immediate stream loading UI\n  return (\n    <div className="space-y-6 animate-pulse">\n      <div className="h-8 w-48 bg-slate-800 rounded" />\n      <div className="grid grid-cols-3 gap-6">\n        <div className="h-32 bg-slate-800 rounded-xl" />\n        <div className="h-32 bg-slate-800 rounded-xl" />\n        <div className="h-32 bg-slate-800 rounded-xl" />\n      </div>\n    </div>\n  )\n}`
    },
    {
      name: 'app/action.ts',
      language: 'typescript',
      code: `'use server'\n\nimport { revalidatePath } from 'next/cache'\n\nexport async function incrementViews() {\n  // 3. Mutating data in Database\n  await db.query(\n    'UPDATE stats SET views = views + 1'\n  )\n  revalidatePath('/dashboard')\n}`
    }
  ]

  return project('Next.js App Router Architecture', [
    // Slide 1: Server-Side Data Fetch
    slide('1. Server Data Fetching', [
      // 1. Title
      layer({
        type: 'heading',
        name: 'Slide Title',
        morphKey: 'slide-title',
        transform: { x: 50, y: 40, width: 800, height: 50 },
        style: { fontSize: 32, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Next.js App Router: Server Data Fetching' },
      }),
      layer({
        type: 'text',
        name: 'Slide Subtitle',
        morphKey: 'slide-sub',
        transform: { x: 50, y: 90, width: 800, height: 30 },
        style: { fontSize: 16, color: '#64748b' },
        data: { text: 'Next.js requests page -> Server initiates data fetch directly to Database' },
      }),

      // 2. Database Cylinder Shape
      layer({
        type: 'shape',
        name: 'Database Shape',
        morphKey: 'db-cylinder',
        transform: { x: 920, y: 40, width: 180, height: 90 },
        style: { fill: '#f1f5f9', borderRadius: 20, borderColor: '#64748b', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Database Label',
        morphKey: 'db-lbl',
        transform: { x: 920, y: 75, width: 180, height: 20 },
        style: { fontSize: 14, fontWeight: 700, color: '#64748b', textAlign: 'center' },
        data: { text: 'PostgreSQL Database' },
      }),

      // 3. Explorer Sidebar Shape
      layer({
        type: 'shape',
        name: 'Explorer Sidebar',
        morphKey: 'explorer-sidebar',
        transform: { x: 50, y: 160, width: 200, height: 460 },
        style: { fill: '#f8fafc', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Explorer Title',
        morphKey: 'explorer-title',
        transform: { x: 65, y: 180, width: 170, height: 20 },
        style: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' },
        data: { text: 'EXPLORER: NEXTJS' },
      }),
      layer({
        type: 'text',
        name: 'Explorer Folder',
        morphKey: 'explorer-fld',
        transform: { x: 75, y: 210, width: 150, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#475569' },
        data: { text: '📁 app' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file page',
        morphKey: 'explorer-file-page',
        transform: { x: 95, y: 240, width: 130, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#007acc' }, // Highlighted active
        data: { text: '📄 page.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file loading',
        morphKey: 'explorer-file-load',
        transform: { x: 95, y: 270, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 loading.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file action',
        morphKey: 'explorer-file-act',
        transform: { x: 95, y: 300, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 action.ts' },
      }),

      // 4. Code Block Layer
      layer({
        type: 'code',
        name: 'Code Component',
        morphKey: 'code-editor',
        transform: { x: 270, y: 160, width: 540, height: 460 },
        data: {
          code: codeFiles[0].code,
          language: 'typescript',
          showLineNumbers: true,
          files: codeFiles,
          activeFile: 0,
          theme: 'github-dark',
          focusLines: [5, 6, 7, 8],
        },
      }),

      // 5. Server container
      layer({
        type: 'shape',
        name: 'Server Runtime',
        morphKey: 'server-runtime',
        transform: { x: 840, y: 160, width: 390, height: 160 },
        style: { fill: '#0a0a0a', borderRadius: 16, borderColor: '#0070f3', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Server Header',
        morphKey: 'server-hdr',
        transform: { x: 860, y: 180, width: 350, height: 24 },
        style: { fontSize: 16, fontWeight: 800, color: '#0070f3' },
        data: { text: 'Next.js Server Runtime' },
      }),
      layer({
        type: 'text',
        name: 'Server Detail',
        morphKey: 'server-det',
        transform: { x: 860, y: 215, width: 350, height: 80 },
        style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
        data: { text: 'Node.js environment compiles layouts and streams standard markup response. Runs server data fetches dynamically.' },
      }),

      // 6. Browser Mockup
      layer({
        type: 'shape',
        name: 'Browser Window',
        morphKey: 'browser-win',
        transform: { x: 840, y: 350, width: 390, height: 270 },
        style: { fill: '#ffffff', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1.5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 1',
        morphKey: 'br-dot-1',
        transform: { x: 855, y: 362, width: 10, height: 10 },
        style: { fill: '#ef4444', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 2',
        morphKey: 'br-dot-2',
        transform: { x: 870, y: 362, width: 10, height: 10 },
        style: { fill: '#f59e0b', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 3',
        morphKey: 'br-dot-3',
        transform: { x: 885, y: 362, width: 10, height: 10 },
        style: { fill: '#10b981', borderRadius: 5 },
      }),
      layer({
        type: 'text',
        name: 'Browser Canvas Content',
        morphKey: 'br-canvas-text',
        transform: { x: 860, y: 440, width: 350, height: 40 },
        style: { fontSize: 15, fontWeight: 700, color: '#94a3b8', textAlign: 'center' },
        data: { text: '🔄 Initiating Server Request...' },
      }),

      // 7. Arrows
      layer({
        type: 'arrow',
        name: 'Arrow DB Request',
        morphKey: 'arrow-db-req',
        transform: { x: 650, y: 90, width: 300, height: 170 },
        style: { color: '#0070f3', borderWidth: 3.5 },
        data: {
          bendType: 'curved',
          startX: 650,
          startY: 250,
          endX: 920,
          endY: 85,
          controlX: 740,
          controlY: 140,
          text: 'DB Read',
        },
      }),
    ]),

    // Slide 2: Loading & Suspense Streaming
    slide('2. Loading & Suspense Streaming', [
      layer({
        type: 'heading',
        name: 'Slide Title',
        morphKey: 'slide-title',
        transform: { x: 50, y: 40, width: 800, height: 50 },
        style: { fontSize: 32, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Next.js App Router: Loading & Streaming' },
      }),
      layer({
        type: 'text',
        name: 'Slide Subtitle',
        morphKey: 'slide-sub',
        transform: { x: 50, y: 90, width: 800, height: 30 },
        style: { fontSize: 16, color: '#64748b' },
        data: { text: 'Server streams page layout immediately -> shows skeleton state while DB resolves' },
      }),

      layer({
        type: 'shape',
        name: 'Database Shape',
        morphKey: 'db-cylinder',
        transform: { x: 920, y: 40, width: 180, height: 90 },
        style: { fill: '#f8fafc', borderRadius: 20, borderColor: '#94a3b8', borderWidth: 1.5 },
      }),
      layer({
        type: 'text',
        name: 'Database Label',
        morphKey: 'db-lbl',
        transform: { x: 920, y: 75, width: 180, height: 20 },
        style: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
        data: { text: 'PostgreSQL Database' },
      }),

      layer({
        type: 'shape',
        name: 'Explorer Sidebar',
        morphKey: 'explorer-sidebar',
        transform: { x: 50, y: 160, width: 200, height: 460 },
        style: { fill: '#f8fafc', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Explorer Title',
        morphKey: 'explorer-title',
        transform: { x: 65, y: 180, width: 170, height: 20 },
        style: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' },
        data: { text: 'EXPLORER: NEXTJS' },
      }),
      layer({
        type: 'text',
        name: 'Explorer Folder',
        morphKey: 'explorer-fld',
        transform: { x: 75, y: 210, width: 150, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#475569' },
        data: { text: '📁 app' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file page',
        morphKey: 'explorer-file-page',
        transform: { x: 95, y: 240, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 page.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file loading',
        morphKey: 'explorer-file-load',
        transform: { x: 95, y: 270, width: 130, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#007acc' }, // Highlighted active
        data: { text: '📄 loading.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file action',
        morphKey: 'explorer-file-act',
        transform: { x: 95, y: 300, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 action.ts' },
      }),

      layer({
        type: 'code',
        name: 'Code Component',
        morphKey: 'code-editor',
        transform: { x: 270, y: 160, width: 540, height: 460 },
        data: {
          code: codeFiles[1].code,
          language: 'typescript',
          showLineNumbers: true,
          files: codeFiles,
          activeFile: 1,
          theme: 'github-dark',
          focusLines: [4, 5, 6, 7, 8],
        },
      }),

      layer({
        type: 'shape',
        name: 'Server Runtime',
        morphKey: 'server-runtime',
        transform: { x: 840, y: 160, width: 390, height: 160 },
        style: { fill: '#0a0a0a', borderRadius: 16, borderColor: '#0070f3', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Server Header',
        morphKey: 'server-hdr',
        transform: { x: 860, y: 180, width: 350, height: 24 },
        style: { fontSize: 16, fontWeight: 800, color: '#0070f3' },
        data: { text: 'Server Streaming' },
      }),
      layer({
        type: 'text',
        name: 'Server Detail',
        morphKey: 'server-det',
        transform: { x: 860, y: 215, width: 350, height: 80 },
        style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
        data: { text: 'Streams app/loading.tsx markup inside index shell. Connects HTTP pipe, holding page components in Suspense.' },
      }),

      // Browser Mockup with beautiful pulse layout skeletons
      layer({
        type: 'shape',
        name: 'Browser Window',
        morphKey: 'browser-win',
        transform: { x: 840, y: 350, width: 390, height: 270 },
        style: { fill: '#ffffff', borderRadius: 12, borderColor: '#0070f3', borderWidth: 1.5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 1',
        morphKey: 'br-dot-1',
        transform: { x: 855, y: 362, width: 10, height: 10 },
        style: { fill: '#ef4444', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 2',
        morphKey: 'br-dot-2',
        transform: { x: 870, y: 362, width: 10, height: 10 },
        style: { fill: '#f59e0b', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 3',
        morphKey: 'br-dot-3',
        transform: { x: 885, y: 362, width: 10, height: 10 },
        style: { fill: '#10b981', borderRadius: 5 },
      }),
      // Skeletons
      layer({
        type: 'shape',
        name: 'Skeleton Title',
        morphKey: 'sk-title',
        transform: { x: 860, y: 400, width: 140, height: 20 },
        style: { fill: '#e2e8f0', borderRadius: 4 },
      }),
      layer({
        type: 'shape',
        name: 'Skeleton Grid 1',
        morphKey: 'sk-card-1',
        transform: { x: 860, y: 440, width: 100, height: 100 },
        style: { fill: '#f1f5f9', borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 1 },
      }),
      layer({
        type: 'shape',
        name: 'Skeleton Grid 2',
        morphKey: 'sk-card-2',
        transform: { x: 980, y: 440, width: 100, height: 100 },
        style: { fill: '#f1f5f9', borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 1 },
      }),
      layer({
        type: 'shape',
        name: 'Skeleton Grid 3',
        morphKey: 'sk-card-3',
        transform: { x: 1100, y: 440, width: 100, height: 100 },
        style: { fill: '#f1f5f9', borderRadius: 8, borderColor: '#cbd5e1', borderWidth: 1 },
      }),

      layer({
        type: 'arrow',
        name: 'Arrow Stream',
        morphKey: 'arrow-stream',
        transform: { x: 500, y: 260, width: 360, height: 230 },
        style: { color: '#ef4444', borderWidth: 3.5, strokeDash: 'dashed' },
        data: {
          bendType: 'curved',
          startX: 540,
          startY: 260,
          endX: 860,
          endY: 450,
          controlX: 680,
          controlY: 380,
          text: 'Streaming shell',
        },
      }),
    ]),

    // Slide 3: Hydration & Server Action Interactivity
    slide('3. Client & Server Action', [
      layer({
        type: 'heading',
        name: 'Slide Title',
        morphKey: 'slide-title',
        transform: { x: 50, y: 40, width: 800, height: 50 },
        style: { fontSize: 32, fontWeight: 800, color: '#0f172a' },
        data: { text: 'Next.js App Router: Server Actions' },
      }),
      layer({
        type: 'text',
        name: 'Slide Subtitle',
        morphKey: 'slide-sub',
        transform: { x: 50, y: 90, width: 800, height: 30 },
        style: { fontSize: 16, color: '#64748b' },
        data: { text: 'Hydrated page updates -> clicks submit -> triggers Server Action dynamically' },
      }),

      layer({
        type: 'shape',
        name: 'Database Shape',
        morphKey: 'db-cylinder',
        transform: { x: 920, y: 40, width: 180, height: 90 },
        style: { fill: '#e0f2fe', borderRadius: 20, borderColor: '#0369a1', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Database Label',
        morphKey: 'db-lbl',
        transform: { x: 920, y: 75, width: 180, height: 20 },
        style: { fontSize: 14, fontWeight: 700, color: '#0369a1', textAlign: 'center' },
        data: { text: 'PostgreSQL Database' },
      }),

      layer({
        type: 'shape',
        name: 'Explorer Sidebar',
        morphKey: 'explorer-sidebar',
        transform: { x: 50, y: 160, width: 200, height: 460 },
        style: { fill: '#f8fafc', borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Explorer Title',
        morphKey: 'explorer-title',
        transform: { x: 65, y: 180, width: 170, height: 20 },
        style: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' },
        data: { text: 'EXPLORER: NEXTJS' },
      }),
      layer({
        type: 'text',
        name: 'Explorer Folder',
        morphKey: 'explorer-fld',
        transform: { x: 75, y: 210, width: 150, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#475569' },
        data: { text: '📁 app' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file page',
        morphKey: 'explorer-file-page',
        transform: { x: 95, y: 240, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 page.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file loading',
        morphKey: 'explorer-file-load',
        transform: { x: 95, y: 270, width: 130, height: 20 },
        style: { fontSize: 13, color: '#64748b' },
        data: { text: '📄 loading.tsx' },
      }),
      layer({
        type: 'text',
        name: 'Explorer file action',
        morphKey: 'explorer-file-act',
        transform: { x: 95, y: 300, width: 130, height: 20 },
        style: { fontSize: 13, fontWeight: 700, color: '#007acc' }, // Highlighted active
        data: { text: '📄 action.ts' },
      }),

      layer({
        type: 'code',
        name: 'Code Component',
        morphKey: 'code-editor',
        transform: { x: 270, y: 160, width: 540, height: 460 },
        data: {
          code: codeFiles[2].code,
          language: 'typescript',
          showLineNumbers: true,
          files: codeFiles,
          activeFile: 2,
          theme: 'github-dark',
          focusLines: [5, 6, 7, 8, 9],
        },
      }),

      layer({
        type: 'shape',
        name: 'Server Runtime',
        morphKey: 'server-runtime',
        transform: { x: 840, y: 160, width: 390, height: 160 },
        style: { fill: '#0a0a0a', borderRadius: 16, borderColor: '#10b981', borderWidth: 2 },
      }),
      layer({
        type: 'text',
        name: 'Server Header',
        morphKey: 'server-hdr',
        transform: { x: 860, y: 180, width: 350, height: 24 },
        style: { fontSize: 16, fontWeight: 800, color: '#10b981' },
        data: { text: 'Server Action Invocation' },
      }),
      layer({
        type: 'text',
        name: 'Server Detail',
        morphKey: 'server-det',
        transform: { x: 860, y: 215, width: 350, height: 80 },
        style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6 },
        data: { text: 'Triggers secure RPC POST call on button submit. Executes backend mutations directly on database. Revalidates layout cache.' },
      }),

      // Browser Mockup in full dashboard metrics state
      layer({
        type: 'shape',
        name: 'Browser Window',
        morphKey: 'browser-win',
        transform: { x: 840, y: 350, width: 390, height: 270 },
        style: { fill: '#ffffff', borderRadius: 12, borderColor: '#10b981', borderWidth: 1.5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 1',
        morphKey: 'br-dot-1',
        transform: { x: 855, y: 362, width: 10, height: 10 },
        style: { fill: '#ef4444', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 2',
        morphKey: 'br-dot-2',
        transform: { x: 870, y: 362, width: 10, height: 10 },
        style: { fill: '#f59e0b', borderRadius: 5 },
      }),
      layer({
        type: 'shape',
        name: 'Browser Dot 3',
        morphKey: 'br-dot-3',
        transform: { x: 885, y: 362, width: 10, height: 10 },
        style: { fill: '#10b981', borderRadius: 5 },
      }),
      // Loaded Dashboard metrics
      layer({
        type: 'text',
        name: 'Dashboard Loaded Title',
        morphKey: 'sk-title',
        transform: { x: 860, y: 400, width: 200, height: 20 },
        style: { fontSize: 15, fontWeight: 800, color: '#0f172a' },
        data: { text: '📊 Dashboard Overview' },
      }),
      // Active loaded cards
      layer({
        type: 'shape',
        name: 'Dashboard Card 1',
        morphKey: 'sk-card-1',
        transform: { x: 860, y: 440, width: 100, height: 80 },
        style: { fill: '#eff6ff', borderRadius: 8, borderColor: '#3b82f6', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Card 1 Metric',
        morphKey: 'sk-c1-met',
        transform: { x: 865, y: 470, width: 90, height: 20 },
        style: { fontSize: 14, fontWeight: 800, color: '#1d4ed8', textAlign: 'center' },
        data: { text: '12.4k Views' },
      }),
      layer({
        type: 'shape',
        name: 'Dashboard Card 2',
        morphKey: 'sk-card-2',
        transform: { x: 980, y: 440, width: 100, height: 80 },
        style: { fill: '#f0fdf4', borderRadius: 8, borderColor: '#22c55e', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Card 2 Metric',
        morphKey: 'sk-c2-met',
        transform: { x: 985, y: 470, width: 90, height: 20 },
        style: { fontSize: 14, fontWeight: 800, color: '#15803d', textAlign: 'center' },
        data: { text: '+23.5% Daily' },
      }),
      // Button trigger
      layer({
        type: 'shape',
        name: 'Increment Button',
        morphKey: 'sk-card-3',
        transform: { x: 1100, y: 440, width: 100, height: 80 },
        style: { fill: '#10b981', borderRadius: 8, borderColor: '#047857', borderWidth: 1 },
      }),
      layer({
        type: 'text',
        name: 'Card 3 Metric',
        morphKey: 'sk-c3-met',
        transform: { x: 1105, y: 465, width: 90, height: 30 },
        style: { fontSize: 10, fontWeight: 800, color: '#ffffff', textAlign: 'center' },
        data: { text: '⚡ Increment\nViews' },
      }),

      layer({
        type: 'arrow',
        name: 'Arrow Action Call',
        morphKey: 'arrow-action-call',
        transform: { x: 500, y: 220, width: 620, height: 260 },
        style: { color: '#10b981', borderWidth: 3.5 },
        data: {
          bendType: 'curved',
          startX: 1120,
          startY: 440,
          endX: 620,
          endY: 230,
          controlX: 840,
          controlY: 300,
          text: 'RPC POST Request',
        },
      }),
      layer({
        type: 'arrow',
        name: 'Arrow Action DB Write',
        morphKey: 'arrow-db-write',
        transform: { x: 560, y: 90, width: 380, height: 160 },
        style: { color: '#0369a1', borderWidth: 3.5, strokeDash: 'dashed' },
        data: {
          bendType: 'curved',
          startX: 560,
          startY: 230,
          endX: 920,
          endY: 85,
          controlX: 720,
          controlY: 130,
          text: 'DB Write',
        },
      }),
      layer({
        type: 'shape',
        name: 'Step 1 Badge',
        morphKey: 'step-1-badge',
        transform: { x: 1040, y: 530, width: 170, height: 26 },
        style: { fill: '#10b981', borderRadius: 13 },
      }),
      layer({
        type: 'text',
        name: 'Step 1 Label',
        morphKey: 'step-1-lbl',
        transform: { x: 1040, y: 535, width: 170, height: 16 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: '1. Click -> Secure RPC' },
      }),
      layer({
        type: 'shape',
        name: 'Step 2 Badge',
        morphKey: 'step-2-badge',
        transform: { x: 860, y: 280, width: 150, height: 26 },
        style: { fill: '#0284c7', borderRadius: 13 },
      }),
      layer({
        type: 'text',
        name: 'Step 2 Label',
        morphKey: 'step-2-lbl',
        transform: { x: 860, y: 285, width: 150, height: 16 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: '2. Node.js SQL Mutation' },
      }),
      layer({
        type: 'shape',
        name: 'Step 3 Badge',
        morphKey: 'step-3-badge',
        transform: { x: 420, y: 72, width: 150, height: 26 },
        style: { fill: '#0369a1', borderRadius: 13 },
      }),
      layer({
        type: 'text',
        name: 'Step 3 Label',
        morphKey: 'step-3-lbl',
        transform: { x: 420, y: 77, width: 150, height: 16 },
        style: { fontSize: 10, fontWeight: 700, color: '#ffffff', textAlign: 'center' },
        data: { text: '3. revalidatePath() Cache' },
      }),
      layer({
        type: 'text',
        name: 'Cursor Pointer Click',
        morphKey: 'cursor-pointer-click',
        transform: { x: 1160, y: 490, width: 40, height: 40 },
        style: { fontSize: 24 },
        data: { text: '🖱️' },
      }),
      layer({
        type: 'arrow',
        name: 'Arrow DB Revalidate',
        morphKey: 'arrow-db-revalidate',
        transform: { x: 380, y: 80, width: 560, height: 120 },
        style: { color: '#38bdf8', borderWidth: 3.5, strokeDash: 'dotted' },
        data: {
          bendType: 'curved',
          startX: 920,
          startY: 85,
          endX: 380,
          endY: 160,
          controlX: 650,
          controlY: 40,
          text: '3. Revalidate Path',
        },
      }),
    ]),
  ])
}
