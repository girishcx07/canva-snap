export type RscNavigationCacheMode =
  | 'client'
  | 'default'
  | 'force-cache'
  | 'no-store'

export type RscNavigationEventDetail = {
  cache: RscNavigationCacheMode
  href: string
}

type RscNavigationState = {
  __viteRscNavigation: true
  cache: RscNavigationCacheMode
}

export const navigationCacheAttribute = 'data-rsc-cache'
export const navigationEventName = 'rsc:navigation'

const navigationCacheModes = new Set<RscNavigationCacheMode>([
  'client',
  'default',
  'force-cache',
  'no-store',
])

export function createNavigationState(
  cache: RscNavigationCacheMode = 'default',
): RscNavigationState {
  return {
    __viteRscNavigation: true,
    cache,
  }
}

export function dispatchRscNavigationEvent(
  detail: RscNavigationEventDetail,
) {
  window.dispatchEvent(new CustomEvent(navigationEventName, { detail }))
}

export function getLinkNavigationCacheMode(link: HTMLAnchorElement) {
  return toNavigationCacheMode(link.getAttribute(navigationCacheAttribute))
}

export function getNavigationCacheMode(state: unknown) {
  if (
    state &&
    typeof state === 'object' &&
    '__viteRscNavigation' in state &&
    state.__viteRscNavigation === true &&
    'cache' in state
  ) {
    return toNavigationCacheMode(state.cache)
  }

  return 'default'
}

export function navigate(
  href: string | URL,
  options: {
    cache?: RscNavigationCacheMode
    replace?: boolean
  } = {},
) {
  if (typeof window === 'undefined') {
    return
  }

  const cache = options.cache ?? 'default'
  const state = createNavigationState(cache)
  const method = options.replace ? 'replaceState' : 'pushState'

  window.history[method](state, '', href)
}

function toNavigationCacheMode(value: unknown): RscNavigationCacheMode {
  if (
    typeof value === 'string' &&
    navigationCacheModes.has(value as RscNavigationCacheMode)
  ) {
    return value as RscNavigationCacheMode
  }

  return 'default'
}
