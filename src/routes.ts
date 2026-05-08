export type RouteCapability = 'ssr' | 'rsc' | 'client' | 'action' | 'diagnostic'

export type AppRoute = {
  capabilities: RouteCapability[]
  description: string
  id: 'overview' | 'ssr' | 'rsc' | 'client' | 'actions' | 'runtime' | 'not-found'
  navLabel: string
  path: string
  title: string
}

export type RouteMatch = {
  pathname: string
  route: AppRoute
  status: number
}

export const appRoutes: AppRoute[] = [
  {
    capabilities: ['ssr', 'rsc', 'client', 'action'],
    description:
      'Full mixed route with SSR HTML, RSC data, a hydrated island, and server actions.',
    id: 'overview',
    navLabel: 'Overview',
    path: '/',
    title: 'React server features with route boundaries',
  },
  {
    capabilities: ['ssr'],
    description:
      'Server-rendered HTML route that fetches data before the browser hydrates.',
    id: 'ssr',
    navLabel: 'SSR',
    path: '/ssr',
    title: 'SSR route',
  },
  {
    capabilities: ['rsc'],
    description:
      'Server component route streamed as a Flight payload and reused by SSR and client navigation.',
    id: 'rsc',
    navLabel: 'RSC',
    path: '/rsc',
    title: 'RSC route',
  },
  {
    capabilities: ['client'],
    description:
      'Hydrated client island route that fetches browser-side data after SSR.',
    id: 'client',
    navLabel: 'Client',
    path: '/client',
    title: 'Client route',
  },
  {
    capabilities: ['action'],
    description:
      'Server action route with progressive form support and RSC re-rendering.',
    id: 'actions',
    navLabel: 'Actions',
    path: '/actions',
    title: 'Server actions route',
  },
  {
    capabilities: ['diagnostic'],
    description:
      'Route map for the Vite environments, request conventions, and app routes.',
    id: 'runtime',
    navLabel: 'Runtime',
    path: '/runtime',
    title: 'Runtime route map',
  },
]

export const notFoundRoute: AppRoute = {
  capabilities: ['diagnostic'],
  description: 'No route matched this URL.',
  id: 'not-found',
  navLabel: 'Not found',
  path: '/404',
  title: 'Route not found',
}

export function matchRoute(url: URL): RouteMatch {
  const pathname = normalizePathname(url.pathname)
  const route = appRoutes.find((item) => item.path === pathname)

  if (route) {
    return {
      pathname,
      route,
      status: 200,
    }
  }

  return {
    pathname,
    route: {
      ...notFoundRoute,
      description: `No route is registered for ${pathname}.`,
      path: pathname,
    },
    status: 404,
  }
}

export function normalizePathname(pathname: string) {
  if (pathname === '/') {
    return pathname
  }

  return pathname.replace(/\/+$/, '') || '/'
}
