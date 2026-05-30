import './index.css'

import { ThemeProvider } from './components/theme/theme-provider'
import { getThemeBootstrapScript } from './components/theme/theme-utils'
import { Dashboard } from './presentation/dashboard/dashboard'
import { Editor } from './presentation/editor/editor'
import { PresentationRuntime } from './presentation/runtime/presentation-runtime'
import { matchRoute, type RouteMatch } from './routes'

export function Root(props: { routeMatch?: RouteMatch; url: URL }) {
  const routeMatch = props.routeMatch ?? matchRoute(props.url)

  return (
    <html lang="en" suppressHydrationWarning>
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
        <ThemeProvider>
          <RoutePage routeMatch={routeMatch} />
        </ThemeProvider>
      </body>
    </html>
  )
}

function RoutePage({ routeMatch }: { routeMatch: RouteMatch }) {
  switch (routeMatch.route.id) {
    case 'home':
      return <Dashboard />
    case 'editor':
      return <Editor />
    case 'present':
      return <PresentationRuntime projectId={routeMatch.params.id} />
    default:
      return <NotFoundPage routeMatch={routeMatch} />
  }
}

function NotFoundPage({ routeMatch }: { routeMatch: RouteMatch }) {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold">Route not found</h1>
        <p className="text-sm text-muted-foreground">
          {routeMatch.pathname} is not registered.
        </p>
        <a
          href="/"
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  )
}
