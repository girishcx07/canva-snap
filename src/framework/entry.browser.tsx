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
import {
  applyBrowserThemeMode,
  getBrowserThemeMode,
  getThemeBootstrapScript,
} from '../components/theme/theme-utils'
import { matchRoute } from '../routes'
import type { RscPayload } from './entry.rsc'
import { GlobalErrorBoundary } from './error-boundary'
import {
  createNavigationState,
  dispatchRscNavigationEvent,
  getLinkNavigationCacheMode,
  getNavigationCacheMode,
  type RscNavigationCacheMode,
} from './navigation'
import { createRscRenderRequest } from './request'

type PayloadState = RscPayload | Promise<RscPayload>
type PayloadUpdateOptions = {
  cache?: RscNavigationCacheMode
  transition?: boolean
}

applyBrowserThemeMode(getBrowserThemeMode())

async function main() {
  // stash `setPayload` function to trigger re-rendering
  // from outside of `BrowserRoot` component (e.g. server function call, navigation, hmr)
  let setPayload: (v: PayloadState, options?: PayloadUpdateOptions) => void

  // deserialize RSC stream back to React VDOM for CSR
  const initialPayload = await createFromReadableStream<RscPayload>(
    // initial RSC stream is injected in SSR stream as <script>...FLIGHT_DATA...</script>
    rscStream,
  )
  const payloadCache = new Map<string, PayloadState>([
    [window.location.href, initialPayload],
  ])

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
      return listenNavigation((navigation) => {
        if (navigation.cache === 'client') {
          dispatchRscNavigationEvent({
            cache: navigation.cache,
            href: window.location.href,
          })
          return
        }

        fetchRscPayload({ cache: navigation.cache })
      })
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
  function fetchRscPayload(options: PayloadUpdateOptions = {}) {
    const cacheMode = options.cache ?? 'default'
    const cacheKey = window.location.href

    if (cacheMode === 'force-cache') {
      const cachedPayload = payloadCache.get(cacheKey)

      if (cachedPayload) {
        setPayload(cachedPayload, { transition: options.transition })
        return
      }
    }

    const renderRequest = createRscRenderRequest(cacheKey)
    const payloadPromise = createFromFetch<RscPayload>(
      fetch(
        renderRequest,
        cacheMode === 'no-store' ? { cache: 'no-store' } : undefined,
      ),
    )

    applyBrowserThemeMode(getBrowserThemeMode())

    if (cacheMode !== 'no-store') {
      payloadCache.set(cacheKey, payloadPromise)
      void payloadPromise.then(
        (payload) => {
          payloadCache.set(cacheKey, payload)
        },
        () => {
          if (payloadCache.get(cacheKey) === payloadPromise) {
            payloadCache.delete(cacheKey)
          }
        },
      )
    }

    setPayload(payloadPromise, { transition: options.transition })
  }

  // register a handler which will be internally called by React
  // on server function request after hydration.
  setServerCallback(async (id, args) => {
    const temporaryReferences = createTemporaryReferenceSet()
    const renderRequest = createRscRenderRequest(window.location.href, {
      id,
      body: await encodeReply(args, { temporaryReferences }),
    })
    const cacheKey = window.location.href
    payloadCache.delete(cacheKey)
    const payloadPromise = createFromFetch<RscPayload>(fetch(renderRequest), {
      temporaryReferences,
    })
    payloadCache.set(cacheKey, payloadPromise)
    setPayload(payloadPromise)
    const payload = await payloadPromise
    payloadCache.set(cacheKey, payload)
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
function listenNavigation(
  onNavigation: (navigation: { cache: RscNavigationCacheMode }) => void,
) {
  function onPopState(event: PopStateEvent) {
    onNavigation({ cache: getNavigationCacheMode(event.state) })
  }

  window.addEventListener('popstate', onPopState)

  const oldPushState = window.history.pushState
  window.history.pushState = function (...args) {
    const res = oldPushState.apply(this, args)
    onNavigation({ cache: getNavigationCacheMode(args[0]) })
    return res
  }

  const oldReplaceState = window.history.replaceState
  window.history.replaceState = function (...args) {
    const res = oldReplaceState.apply(this, args)
    onNavigation({ cache: getNavigationCacheMode(args[0]) })
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
      history.pushState(
        createNavigationState(getLinkNavigationCacheMode(link)),
        '',
        link.href,
      )
    }
  }
  document.addEventListener('click', onClick)

  return () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onPopState)
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
  const themeMode = getBrowserThemeMode()
  applyBrowserThemeMode(themeMode)

  return (
    <html
      lang="en"
      className={themeMode === 'dark' ? 'dark' : undefined}
      style={{ colorScheme: themeMode }}
    >
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
        <title>{routeMatch.route.title}</title>
      </head>
      <body>
        <main className="grid min-h-svh place-items-center bg-background">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </main>
      </body>
    </html>
  )
}
