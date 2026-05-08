import {
  createFromReadableStream,
  createFromFetch,
  setServerCallback,
  createTemporaryReferenceSet,
  encodeReply,
} from '@vitejs/plugin-rsc/browser'
import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { rscStream } from 'rsc-html-stream/client'
import { Badge } from '../components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { appRoutes, matchRoute, type AppRoute } from '../routes'
import type { RscPayload } from './entry.rsc'
import { GlobalErrorBoundary } from './error-boundary'
import { createRscRenderRequest } from './request'

type PayloadState = RscPayload | Promise<RscPayload>
type PayloadUpdateOptions = { transition?: boolean }

async function main() {
  // stash `setPayload` function to trigger re-rendering
  // from outside of `BrowserRoot` component (e.g. server function call, navigation, hmr)
  let setPayload: (v: PayloadState, options?: PayloadUpdateOptions) => void

  // deserialize RSC stream back to React VDOM for CSR
  const initialPayload = await createFromReadableStream<RscPayload>(
    // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
    rscStream,
  )

  // browser root component to (re-)render RSC payload as state
  function BrowserRoot() {
    const [payloadState, setPayload_] =
      React.useState<PayloadState>(initialPayload)
    const payload = isPromisePayload(payloadState)
      ? React.use(payloadState)
      : payloadState

    React.useEffect(() => {
      setPayload = (v, options) => {
        const update = () => setPayload_(v)
        if (options?.transition) {
          React.startTransition(update)
        } else {
          update()
        }
      }
    }, [setPayload_])

    // re-fetch/render on client side navigation
    React.useEffect(() => {
      return listenNavigation(() => fetchRscPayload())
    }, [])

    return payload.root
  }

  function BrowserRuntimeRoot() {
    const [enableDocumentFallback, setEnableDocumentFallback] =
      React.useState(false)

    React.useEffect(() => {
      setEnableDocumentFallback(true)
    }, [])

    if (!enableDocumentFallback) {
      return <BrowserRoot />
    }

    return (
      <React.Suspense fallback={<BrowserDocumentFallback />}>
        <BrowserRoot />
      </React.Suspense>
    )
  }

  // re-fetch RSC and trigger re-rendering
  function fetchRscPayload(options?: PayloadUpdateOptions) {
    const renderRequest = createRscRenderRequest(window.location.href)
    setPayload(createFromFetch<RscPayload>(fetch(renderRequest)), options)
  }

  // register a handler which will be internally called by React
  // on server function request after hydration.
  setServerCallback(async (id, args) => {
    const temporaryReferences = createTemporaryReferenceSet()
    const renderRequest = createRscRenderRequest(window.location.href, {
      id,
      body: await encodeReply(args, { temporaryReferences }),
    })
    const payloadPromise = createFromFetch<RscPayload>(fetch(renderRequest), {
      temporaryReferences,
    })
    setPayload(payloadPromise)
    const payload = await payloadPromise
    setPayload(payload)
    const { ok, data } = payload.returnValue!
    if (!ok) throw data
    return data
  })

  // hydration
  const browserRoot = (
    <React.StrictMode>
      <GlobalErrorBoundary>
        <BrowserRuntimeRoot />
      </GlobalErrorBoundary>
    </React.StrictMode>
  )
  if ('__NO_HYDRATE' in globalThis) {
    createRoot(document).render(browserRoot)
  } else {
    hydrateRoot(document, browserRoot, {
      formState: initialPayload.formState,
    })
  }

  // implement server HMR by triggering re-fetch/render of RSC upon server code change
  if (import.meta.hot) {
    import.meta.hot.on('rsc:update', () => {
      fetchRscPayload({ transition: true })
    })
  }
}

// a little helper to setup events interception for client side navigation
function listenNavigation(onNavigation: () => void) {
  window.addEventListener('popstate', onNavigation)

  const oldPushState = window.history.pushState
  window.history.pushState = function (...args) {
    const res = oldPushState.apply(this, args)
    onNavigation()
    return res
  }

  const oldReplaceState = window.history.replaceState
  window.history.replaceState = function (...args) {
    const res = oldReplaceState.apply(this, args)
    onNavigation()
    return res
  }

  function onClick(e: MouseEvent) {
    let link = (e.target as Element).closest('a')
    if (
      link &&
      link instanceof HTMLAnchorElement &&
      link.href &&
      (!link.target || link.target === '_self') &&
      link.origin === location.origin &&
      !link.hasAttribute('download') &&
      e.button === 0 && // left clicks only
      !e.metaKey && // open in new tab (mac)
      !e.ctrlKey && // open in new tab (windows)
      !e.altKey && // download
      !e.shiftKey &&
      !e.defaultPrevented
    ) {
      e.preventDefault()
      history.pushState(null, '', link.href)
    }
  }
  document.addEventListener('click', onClick)

  return () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onNavigation)
    window.history.pushState = oldPushState
    window.history.replaceState = oldReplaceState
  }
}

main()

function isPromisePayload(value: PayloadState): value is Promise<RscPayload> {
  return typeof (value as { then?: unknown }).then === 'function'
}

function BrowserDocumentFallback() {
  const routeMatch = matchRoute(new URL(window.location.href))

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{routeMatch.route.title}</title>
      </head>
      <body>
        <main className="min-h-svh bg-background">
          <section className="border-b bg-muted/30">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex max-w-3xl flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {routeMatch.route.capabilities.map((capability) => (
                    <Badge key={capability} variant="outline">
                      {capability.toUpperCase()}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                    {routeMatch.route.title}
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    {routeMatch.route.description}
                  </p>
                </div>
              </div>

              <FallbackNav route={routeMatch.route} />

              <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <p>Request: {window.location.href}</p>
                <p>Status: {routeMatch.status}</p>
                <p>Streaming RSC payload</p>
              </div>
            </div>
          </section>

          <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>{routeMatch.route.navLabel}</CardTitle>
                <CardDescription>{routeMatch.route.description}</CardDescription>
                <CardAction>
                  <Badge variant="secondary">Loading</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          </section>
        </main>
      </body>
    </html>
  )
}

function FallbackNav({ route: currentRoute }: { route: AppRoute }) {
  return (
    <nav aria-label="App routes" className="flex flex-wrap gap-2">
      {appRoutes.map((route) => (
        <a
          key={route.id}
          aria-current={route.id === currentRoute.id ? 'page' : undefined}
          className={
            route.id === currentRoute.id
              ? 'inline-flex h-8 items-center rounded-lg border border-primary bg-primary px-2.5 text-sm font-medium text-primary-foreground'
              : 'inline-flex h-8 items-center rounded-lg border bg-background px-2.5 text-sm font-medium text-foreground'
          }
          href={route.path}
        >
          {route.navLabel}
        </a>
      ))}
    </nav>
  )
}
