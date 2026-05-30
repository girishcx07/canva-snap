// Core domain model: Project -> Slides -> Layers -> Components -> Events -> Animations.
// Kept intentionally decoupled (plain serializable data) so the same shapes can back
// a local store today and a CRDT / multiplayer document later.

export type ID = string

export type EasingName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bounce'

export type Transform = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  opacity: number
}

export type LayerStyle = {
  fill?: string
  color?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  shadow?: string
  padding?: number
}

// Animation -----------------------------------------------------------------

export type AnimationCategory = 'entrance' | 'exit' | 'attention' | 'advanced'

// A keyframe is a partial transform applied at a normalized offset (0..1).
export type Keyframe = {
  offset: number
  transform: Partial<Transform>
}

export type AnimationPreset = {
  id: string
  name: string
  category: AnimationCategory
  keyframes: Keyframe[]
  defaultDurationMs: number
  defaultEasing: EasingName
}

export type AnimationTrigger =
  | 'slide-enter'
  | 'slide-exit'
  | 'click'
  | 'with-previous'
  | 'after-previous'

export type AnimationInstance = {
  id: ID
  presetId: string
  trigger: AnimationTrigger
  delayMs: number
  durationMs: number
  easing: EasingName
  repeat: number
}

// Events --------------------------------------------------------------------

export type TriggerType =
  | 'click'
  | 'hover'
  | 'slide-enter'
  | 'slide-exit'
  | 'timer'
  | 'keyboard'
  | 'custom'

export type ActionType =
  | 'show-layer'
  | 'hide-layer'
  | 'animate-layer'
  | 'change-state'
  | 'start-timeline'
  | 'navigate-slide'
  | 'trigger-sequence'

export type EventAction = {
  type: ActionType
  params: Record<string, unknown>
}

export type EventBinding = {
  id: ID
  trigger: TriggerType
  triggerParams?: Record<string, unknown>
  actions: EventAction[]
}

// Layers --------------------------------------------------------------------

// `type` is a registry key (string) so new component kinds are pluggable without
// changing this file. Type-specific fields live in `data`.
export type Layer = {
  id: ID
  type: string
  name: string
  transform: Transform
  style: LayerStyle
  locked: boolean
  hidden: boolean
  // Shared-element key used by the morph engine to match elements across slides.
  morphKey?: string
  data: Record<string, unknown>
  children?: Layer[]
  animations: AnimationInstance[]
  events: EventBinding[]
}

// Timeline ------------------------------------------------------------------

export type TimelineTrack = {
  layerId: ID
  animationId: ID
  startMs: number
}

export type Timeline = {
  durationMs: number
  mode: 'sequential' | 'parallel'
  tracks: TimelineTrack[]
}

// Slides & Project ----------------------------------------------------------

export type SlideTransitionType = 'none' | 'fade' | 'slide' | 'morph'

export type SlideTransition = {
  type: SlideTransitionType
  durationMs: number
  easing: EasingName
}

export type Slide = {
  id: ID
  name: string
  background: string
  layers: Layer[]
  transition: SlideTransition
  timeline?: Timeline
  notes: string
  // Auto-advance duration for autoplay; undefined = manual.
  durationMs?: number
}

export type Project = {
  id: ID
  name: string
  description: string
  width: number
  height: number
  theme: 'light' | 'dark'
  slides: Slide[]
  createdAt: string
  updatedAt: string
}
