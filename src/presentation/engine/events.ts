// Event system. An extensible, data-driven layer: bindings describe a trigger
// plus a list of actions. Action *behaviour* is supplied by the runtime through
// an ActionContext, and new action types can be registered without touching the
// runtime — keeping the editor model and the player decoupled.

import type {
  ActionType,
  EventAction,
  EventBinding,
  ID,
  TriggerType,
} from '../types'

export type ActionContext = {
  showLayer: (id: ID) => void
  hideLayer: (id: ID) => void
  animateLayer: (id: ID, presetId: string) => void
  changeState: (key: string, value: unknown) => void
  startTimeline: () => void
  navigateSlide: (target: 'next' | 'prev' | number) => void
  triggerSequence: (bindingIds: ID[]) => void
}

export type ActionHandler = (
  action: EventAction,
  ctx: ActionContext,
) => void | Promise<void>

export const TRIGGERS: { type: TriggerType; label: string }[] = [
  { type: 'click', label: 'On Click' },
  { type: 'hover', label: 'On Hover' },
  { type: 'slide-enter', label: 'On Slide Enter' },
  { type: 'slide-exit', label: 'On Slide Exit' },
  { type: 'timer', label: 'After Delay' },
  { type: 'keyboard', label: 'On Key Press' },
  { type: 'custom', label: 'Custom Event' },
]

const handlers: Record<string, ActionHandler> = {
  'show-layer': (a, ctx) => ctx.showLayer(String(a.params.layerId)),
  'hide-layer': (a, ctx) => ctx.hideLayer(String(a.params.layerId)),
  'animate-layer': (a, ctx) =>
    ctx.animateLayer(String(a.params.layerId), String(a.params.presetId)),
  'change-state': (a, ctx) =>
    ctx.changeState(String(a.params.key), a.params.value),
  'start-timeline': (_a, ctx) => ctx.startTimeline(),
  'navigate-slide': (a, ctx) =>
    ctx.navigateSlide(
      (a.params.target as 'next' | 'prev' | number) ?? 'next',
    ),
  'trigger-sequence': (a, ctx) =>
    ctx.triggerSequence((a.params.bindingIds as ID[]) ?? []),
}

export function registerAction(type: string, handler: ActionHandler): void {
  handlers[type] = handler
}

export const ACTION_TYPES: ActionType[] = [
  'show-layer',
  'hide-layer',
  'animate-layer',
  'change-state',
  'start-timeline',
  'navigate-slide',
  'trigger-sequence',
]

export async function runActions(
  actions: EventAction[],
  ctx: ActionContext,
): Promise<void> {
  for (const action of actions) {
    const handler = handlers[action.type]
    if (handler) await handler(action, ctx)
  }
}

// Fire every binding on a set of layers whose trigger matches.
export async function fireTrigger(
  bindings: { layerId: ID; binding: EventBinding }[],
  trigger: TriggerType,
  ctx: ActionContext,
): Promise<void> {
  for (const { binding } of bindings) {
    if (binding.trigger === trigger) await runActions(binding.actions, ctx)
  }
}
