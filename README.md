# Deck

A presentation-first editor for developers — Canva-style editing with
Snappify-style morphing transitions and a code-walkthrough engine. Built on the
Vite RSC + React 19 mini-framework and shadcn/ui (Base UI).

## Features

- **Editor** (`/editor`): top toolbar, slide navigator, element palette, layer
  panel, property inspector, and a canvas with select / drag / resize / rotate
  and center snap guides. Undo/redo, duplicate, lock, hide, reorder.
- **Morphing transitions**: consecutive slides are diffed, matching elements
  (by `morphKey` or type+name) are detected, and position, size, rotation,
  opacity, scale, border-radius and color are interpolated automatically.
- **Code presentation**: the existing shiki highlighter powers syntax
  highlighting, line numbers, focus mode, diff markers and a progressive
  visible-range window that smooth-scrolls between slides.
- **Animation + timeline + events**: entrance/exit/attention/advanced presets,
  a sequential/parallel timeline scheduler, and a pluggable trigger→action
  event system.
- **Runtime** (`/present/:id`): fullscreen player with keyboard/click
  navigation, progress, morph transitions, timeline sync and event execution.
- **Dashboard** (`/`): presentations gallery built on the shadcn `dashboard-01`
  shell (sidebar + header).
- **Export**: a single `Exporter` abstraction with a working HTML exporter and
  staged PNG/PDF/GIF/MP4 implementations behind the same interface.

## Architecture

```
src/presentation/
  types.ts            Project → Slides → Layers → Components → Events → Animations
  doc.ts              Pure immutable document operations (collaboration-ready)
  store.ts            useSyncExternalStore store + undo/redo + drag transactions
  registry.tsx        Pluggable component registry + LayerView renderer
  sample-project.ts   Presentation-focused sample deck
  engine/             easing · animation · timeline · morph · events
  components/         code-block (shiki)
  editor/             editor · toolbar · canvas · navigator · palette · layers · inspector
  runtime/            player · presentation-runtime
  export/             Exporter interface + registry
```

State is plain serializable data and the document ops are pure, so the same
shapes can back a CRDT/multiplayer layer later. Component kinds, animation
presets, event actions and exporters are all registered and pluggable.

## Run

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/`.

- `/` — presentations dashboard
- `/editor` — editor workspace
- `/present/sample` — fullscreen runtime

## Build

```sh
pnpm build
pnpm preview
```

Type-check (TypeScript is not a project dependency):

```sh
npx -y -p typescript@5.8.3 tsc --noEmit
```

## Stack

- Vite 8 with `@vitejs/plugin-rsc`
- React 19 (RSC + SSR + client islands)
- shadcn/ui (Base UI components) + Tailwind CSS v4
- shiki for code highlighting
