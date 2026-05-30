// App route table. Drives SSR status, navigation, and RSC payloads. Supports a
// trailing dynamic id segment for editor/present routes.

export type AppRoute = {
  description: string
  id: 'home' | 'editor' | 'present' | 'not-found'
  navLabel: string
  path: string
  title: string
}

export type RouteMatch = {
  pathname: string
  params: { id?: string }
  route: AppRoute
  status: number
}

export const appRoutes: AppRoute[] = [
  {
    description: 'Workspace dashboard of your presentations.',
    id: 'home',
    navLabel: 'Dashboard',
    path: '/',
    title: 'Presentations',
  },
  {
    description: 'Canva-style editor with Snappify-style morphing.',
    id: 'editor',
    navLabel: 'Editor',
    path: '/editor',
    title: 'Editor',
  },
  {
    description: 'Fullscreen presentation runtime.',
    id: 'present',
    navLabel: 'Present',
    path: '/present',
    title: 'Presenting',
  },
]

export const notFoundRoute: AppRoute = {
  description: 'No route matched this URL.',
  id: 'not-found',
  navLabel: 'Not found',
  path: '/404',
  title: 'Route not found',
}

export function matchRoute(url: URL): RouteMatch {
  const pathname = normalizePathname(url.pathname)
  const parts = pathname.split('/').filter(Boolean)
  const head = parts[0]

  if (pathname === '/') {
    return { pathname, params: {}, route: appRoutes[0], status: 200 }
  }

  if (head === 'editor') {
    return { pathname, params: { id: parts[1] }, route: appRoutes[1], status: 200 }
  }

  if (head === 'present') {
    return { pathname, params: { id: parts[1] }, route: appRoutes[2], status: 200 }
  }

  return {
    pathname,
    params: {},
    route: {
      ...notFoundRoute,
      description: `No route is registered for ${pathname}.`,
      path: pathname,
    },
    status: 404,
  }
}

export function normalizePathname(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '') || '/'
}
