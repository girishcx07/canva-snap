// Event system. An extensible, data-driven layer: bindings describe a trigger
// plus a list of actions. Action *behaviour* is supplied by the runtime through
// an ActionContext, and new action types can be registered without touching the
// runtime — keeping the editor model and the player decoupled.

import type {
  ActionType,
  EasingName,
  EventAction,
  EventBinding,
  ID,
  TriggerType,
} from '../types'

export type ActionContext = {
  showLayer: (id: ID) => void
  hideLayer: (id: ID) => void
  animateLayer: (
    id: ID,
    presetId: string,
    options?: { durationMs?: number; delayMs?: number; easing?: EasingName },
  ) => void
  changeState: (key: string, value: unknown) => void
  startTimeline: () => void
  navigateSlide: (target: 'next' | 'prev' | number) => void
  triggerSequence: (bindingIds: ID[]) => void
}

export type ActionHandler = (
  action: EventAction,
  ctx: ActionContext,
  sourceLayerId?: ID,
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
  'show-layer': (a, ctx, sourceLayerId) => {
    const targetId = a.params.layerId && a.params.layerId !== 'self' ? String(a.params.layerId) : sourceLayerId
    if (targetId) ctx.showLayer(targetId)
  },
  'hide-layer': (a, ctx, sourceLayerId) => {
    const targetId = a.params.layerId && a.params.layerId !== 'self' ? String(a.params.layerId) : sourceLayerId
    if (targetId) ctx.hideLayer(targetId)
  },
  'animate-layer': (a, ctx, sourceLayerId) => {
    const targetId = a.params.layerId && a.params.layerId !== 'self' ? String(a.params.layerId) : sourceLayerId
    if (targetId) {
      ctx.animateLayer(targetId, String(a.params.presetId), {
        durationMs: a.params.durationMs ? Number(a.params.durationMs) : undefined,
        delayMs: a.params.delayMs ? Number(a.params.delayMs) : undefined,
        easing: a.params.easing as EasingName | undefined,
      })
    }
  },
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
  sourceLayerId?: ID,
): Promise<void> {
  for (const action of actions) {
    const handler = handlers[action.type]
    if (handler) await handler(action, ctx, sourceLayerId)
  }
}

// Fire every binding on a set of layers whose trigger matches.
export async function fireTrigger(
  bindings: { layerId: ID; binding: EventBinding }[],
  trigger: TriggerType,
  ctx: ActionContext,
): Promise<void> {
  for (const { layerId, binding } of bindings) {
    if (binding.trigger === trigger) await runActions(binding.actions, ctx, layerId)
  }
}
