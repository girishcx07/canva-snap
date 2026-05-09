import './index.css'

import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  FileCode2Icon,
  RouteIcon,
  SearchIcon,
  ServerCogIcon,
  SparklesIcon,
} from 'lucide-react'
import { Suspense, type ReactNode } from 'react'

import {
  checkNameAge,
  getLatestNameInsight,
  getServerCounter,
  updateServerCounter,
} from './action.tsx'
import type { NameInsight } from './action.tsx'
import { ClientApiPanel } from './components/demo/client-api-panel.tsx'
import { RepoCodeBrowser } from './components/repo/repo-code-browser'
import { RepoCodeBrowserSkeleton } from './components/repo/repo-code-browser-skeleton'
import { ThemeProvider } from './components/theme/theme-provider'
import { getThemeBootstrapScript } from './components/theme/theme-utils'
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from './components/ui/field'
import { Input } from './components/ui/input'
import { Separator } from './components/ui/separator'
import { Skeleton } from './components/ui/skeleton'
import { cn } from './lib/utils'
import { getGitHubRepoSnapshot } from './repo-data'
import { getRscTodos, getSsrRepoSnapshot, type Todo } from './server-data'
import { Link } from './framework/link'
import {
  appRoutes,
  matchRoute,
  type AppRoute,
  type RepoRoute,
  type RouteCapability,
  type RouteMatch,
} from './routes'

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
          <App routeMatch={routeMatch} url={props.url} />
        </ThemeProvider>
      </body>
    </html>
  )
}

function App(props: { routeMatch: RouteMatch; url: URL }) {
  const isRepoHome = props.routeMatch.route.id === 'overview'

  return (
    <main className="min-h-svh bg-background">
      {isRepoHome ? null : (
        <AppHeader routeMatch={props.routeMatch} url={props.url} />
      )}
      <Suspense fallback={<RoutePageFallback route={props.routeMatch.route} />}>
        <RoutePage routeMatch={props.routeMatch} />
      </Suspense>
    </main>
  )
}

function AppHeader({
  routeMatch,
  url,
}: {
  routeMatch: RouteMatch
  url: URL
}) {
  const route = routeMatch.route

  return (
    <section className="border-b bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {route.capabilities.map((capability) => (
                <CapabilityBadge key={capability} capability={capability} />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {route.title}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {route.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a
              href={getRscHref(url)}
              target="_blank"
              className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 font-medium hover:bg-muted"
            >
              Flight payload
              <ArrowUpRightIcon className="size-4" />
            </a>
            <a
              href={getNoJsHref(url)}
              target="_blank"
              className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 font-medium hover:bg-muted"
            >
              No JS render
              <ArrowUpRightIcon className="size-4" />
            </a>
          </div>
        </div>

        <AppNav pathname={routeMatch.pathname} />

        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p>Request: {url.href}</p>
          <p>Status: {routeMatch.status}</p>
          <p>RSC endpoint: {getRscHref(url)}</p>
        </div>
      </div>
    </section>
  )
}

function AppNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="App routes" className="flex flex-wrap gap-2">
      {appRoutes.map((route) => {
        const isActive = route.path === pathname

        return (
          <Link
            key={route.id}
            cache="force-cache"
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 items-center rounded-lg border px-2.5 text-sm font-medium transition-colors hover:bg-muted',
              isActive
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-background text-foreground',
            )}
            href={route.path}
          >
            {route.navLabel}
          </Link>
        )
      })}
    </nav>
  )
}

function RoutePage({ routeMatch }: { routeMatch: RouteMatch }) {
  switch (routeMatch.route.id) {
    case 'overview':
      return <OverviewPage route={routeMatch.repo} />
    case 'ssr':
      return <SsrPage />
    case 'rsc':
      return <RscPage />
    case 'client':
      return <ClientPage />
    case 'actions':
      return <ActionsPage />
    case 'runtime':
      return <RuntimePage />
    default:
      return <NotFoundPage routeMatch={routeMatch} />
  }
}

function RoutePageFallback({ route }: { route: AppRoute }) {
  if (route.id === 'overview') {
    return <RepoCodeBrowserSkeleton />
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>{route.navLabel}</CardTitle>
          <CardDescription>{route.description}</CardDescription>
          <CardAction>
            <CapabilityBadge capability={route.capabilities[0]} />
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
  )
}

async function OverviewPage({ route }: { route?: RepoRoute }) {
  const repo = await getGitHubRepoSnapshot()

  return <RepoCodeBrowser route={route} snapshot={repo} />
}

async function SsrPage() {
  const repo = await getSsrRepoSnapshot()

  return (
    <RouteShell>
      <SsrCard repo={repo} />
      <RouteExplanation
        capability="ssr"
        title="HTML response path"
        details={[
          'The RSC entry renders the app tree into a Flight stream first.',
          'The SSR entry deserializes that stream, renders HTML, and injects the initial Flight payload.',
          'The browser hydrates the same tree with the client bootstrap script from Vite.',
        ]}
      />
    </RouteShell>
  )
}

async function RscPage() {
  const todos = await getRscTodos()

  return (
    <RouteShell>
      <RscCard todos={todos} />
      <RouteExplanation
        capability="rsc"
        title="Flight response path"
        details={[
          'Client navigation appends the _.rsc suffix to the current pathname.',
          'The RSC environment serializes the server component payload as text/x-component.',
          'The browser entry decodes the new payload and swaps the route without a full reload.',
        ]}
      />
    </RouteShell>
  )
}

function ClientPage() {
  return (
    <RouteShell>
      <ClientApiPanel />
      <RouteExplanation
        capability="client"
        title="Hydration path"
        details={[
          'Only files with use client can hold state, effects, browser fetches, and event handlers.',
          'The client route still SSRs the outer document before the island wakes up.',
          'The browser entry listens for history navigation and refetches the active RSC route.',
        ]}
      />
    </RouteShell>
  )
}

async function ActionsPage() {
  const [serverCounter, latestNameInsight] = await Promise.all([
    getServerCounter(),
    getLatestNameInsight(),
  ])

  return (
    <RouteShell>
      <ServerActionCard
        insight={latestNameInsight}
        serverCounter={serverCounter}
      />
      <RouteExplanation
        capability="action"
        title="Mutation path"
        details={[
          'Hydrated calls send the action id through the x-rsc-action request header.',
          'Progressive forms post FormData without JavaScript and SSR the updated route.',
          'After the action runs, the RSC render includes the latest server state.',
        ]}
      />
    </RouteShell>
  )
}

function RuntimePage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Vite environments</CardTitle>
          <CardDescription>
            These are the configured runtime boundaries in vite.config.ts.
          </CardDescription>
          <CardAction>
            <Badge variant="outline">Vite 8</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <EnvironmentRow
            name="rsc"
            value="Server component serialization and server function handling."
          />
          <EnvironmentRow
            name="ssr"
            value="Flight deserialization, React DOM server rendering, and HTML streaming."
          />
          <EnvironmentRow
            name="client"
            value="Hydration, client-side RSC refetching, and server action calls."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request conventions</CardTitle>
          <CardDescription>
            The route resolver stays above the Vite entries.
          </CardDescription>
          <CardAction>
            <RouteIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <RuntimeFact label="HTML routes" value="/, /ssr, /rsc, /client" />
          <RuntimeFact label="RSC routes" value="/_.rsc, /ssr_.rsc, /rsc_.rsc" />
          <RuntimeFact label="Actions" value="POST with x-rsc-action or FormData" />
          <RuntimeFact label="404" value="Unknown HTML routes return status 404" />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Registered app routes</CardTitle>
          <CardDescription>
            The same route table drives SSR status, navigation, and RSC payloads.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {appRoutes.map((route) => (
            <RouteRegistryRow key={route.id} route={route} />
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function NotFoundPage({ routeMatch }: { routeMatch: RouteMatch }) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <Alert variant="destructive">
        <AlertTitle>Route not found</AlertTitle>
        <AlertDescription>
          {routeMatch.pathname} is not registered in the app route table.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Available routes</CardTitle>
          <CardDescription>
            These paths are ready for SSR, RSC fetches, and client navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {appRoutes.map((route) => (
            <RouteRegistryRow key={route.id} route={route} />
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function RouteShell({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
      {children}
    </section>
  )
}

function RouteExplanation({
  capability,
  details,
  title,
}: {
  capability: RouteCapability
  details: string[]
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Route-specific notes for this Vite RSC boundary.
        </CardDescription>
        <CardAction>
          <CapabilityBadge capability={capability} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3 text-sm">
          {details.map((detail) => (
            <li key={detail} className="flex gap-3">
              <FileCode2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function SsrCard({
  repo,
}: {
  repo: Awaited<ReturnType<typeof getSsrRepoSnapshot>>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SSR snapshot</CardTitle>
        <CardDescription>
          GitHub repo data is fetched on the server and streamed as HTML.
        </CardDescription>
        <CardAction>
          <ApiBadge fallback={repo.fallback} label="SSR" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <a
            href={repo.data.html_url}
            target="_blank"
            className="font-medium underline-offset-4 hover:underline"
          >
            {repo.data.full_name}
          </a>
          <p className="text-sm text-muted-foreground">
            {repo.data.description}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Stars" value={formatNumber(repo.data.stargazers_count)} />
          <Metric label="Forks" value={formatNumber(repo.data.forks_count)} />
          <Metric
            label="Issues"
            value={formatNumber(repo.data.open_issues_count)}
          />
        </div>
        {repo.error ? (
          <Alert variant="destructive">
            <AlertTitle>GitHub fallback</AlertTitle>
            <AlertDescription>{repo.error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>Updated {formatDate(repo.data.pushed_at)}</span>
        <span className="truncate">{repo.source}</span>
      </CardFooter>
    </Card>
  )
}

function RscCard({
  todos,
}: {
  todos: Awaited<ReturnType<typeof getRscTodos>>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RSC data component</CardTitle>
        <CardDescription>
          JSONPlaceholder todos are fetched inside the server component tree.
        </CardDescription>
        <CardAction>
          <ApiBadge fallback={todos.fallback} label="RSC" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {todos.data.slice(0, 5).map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
        {todos.error ? (
          <Alert variant="destructive">
            <AlertTitle>JSONPlaceholder fallback</AlertTitle>
            <AlertDescription>{todos.error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>Fetched {formatTime(todos.fetchedAt)}</span>
        <span className="truncate">{todos.source}</span>
      </CardFooter>
    </Card>
  )
}

function ServerActionCard({
  insight,
  serverCounter,
}: {
  insight: NameInsight | null
  serverCounter: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server actions</CardTitle>
        <CardDescription>
          Forms call server functions, mutate server memory, then re-render RSC.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Action</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={checkNameAge}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  key={insight?.name ?? 'empty-name'}
                  id="name"
                  name="name"
                  placeholder="Ada"
                  defaultValue={insight?.name ?? ''}
                  autoComplete="given-name"
                />
                <Button type="submit" className="sm:w-auto">
                  <SearchIcon data-icon="inline-start" />
                  Check
                </Button>
              </div>
              <FieldDescription>
                Agify runs from the server action, not from browser code.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>

        {insight ? <NameInsightResult insight={insight} /> : null}

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Server counter: {serverCounter}</p>
            <p className="text-sm text-muted-foreground">
              The starter action is still here as a tiny mutation.
            </p>
          </div>
          <form action={updateServerCounter.bind(null, 1)}>
            <Button type="submit" variant="secondary">
              <SparklesIcon data-icon="inline-start" />
              Increment
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

function NameInsightResult({ insight }: { insight: NameInsight }) {
  if (insight.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Server action fallback</AlertTitle>
        <AlertDescription>{insight.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
      <Metric label="Name" value={insight.name} />
      <Metric label="Estimated age" value={insight.age ?? 'No estimate'} />
      <Metric label="Sample size" value={formatNumber(insight.count)} />
      <p className="text-muted-foreground sm:col-span-3">
        Checked {formatTime(insight.checkedAt)} via {insight.source}
      </p>
    </div>
  )
}

function TodoRow({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm">
      {todo.completed ? (
        <CheckCircle2Icon className="mt-0.5 size-4 text-primary" />
      ) : (
        <DatabaseIcon className="mt-0.5 size-4 text-muted-foreground" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2">{todo.title}</p>
        <p className="text-xs text-muted-foreground">User {todo.userId}</p>
      </div>
      <Badge variant={todo.completed ? 'secondary' : 'outline'}>
        {todo.completed ? 'Done' : 'Open'}
      </Badge>
    </li>
  )
}

function EnvironmentRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-background p-3 text-sm">
      <ServerCogIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function RuntimeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-background p-3 sm:grid-cols-[8rem_1fr]">
      <span className="font-medium">{label}</span>
      <span className="min-w-0 break-words text-muted-foreground">{value}</span>
    </div>
  )
}

function RouteRegistryRow({ route }: { route: AppRoute }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <a
            href={route.path}
            className="font-medium underline-offset-4 hover:underline"
          >
            {route.path}
          </a>
          <p className="text-sm text-muted-foreground">{route.title}</p>
        </div>
        <Badge variant="secondary">{route.navLabel}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {route.capabilities.map((capability) => (
          <CapabilityBadge key={capability} capability={capability} />
        ))}
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  )
}

function ApiBadge({
  fallback,
  label,
}: {
  fallback: boolean
  label: string
}) {
  return (
    <Badge variant={fallback ? 'secondary' : 'outline'}>
      {label} {fallback ? 'Fallback' : 'Live'}
    </Badge>
  )
}

function CapabilityBadge({ capability }: { capability: RouteCapability }) {
  const labels = {
    action: 'Action',
    client: 'Client',
    diagnostic: 'Diagnostic',
    rsc: 'RSC',
    ssr: 'SSR',
  } satisfies Record<RouteCapability, string>

  return (
    <Badge variant={capability === 'diagnostic' ? 'secondary' : 'outline'}>
      {labels[capability]}
    </Badge>
  )
}

function getRscHref(url: URL) {
  const rscUrl = new URL(url)
  rscUrl.pathname += '_.rsc'
  return rscUrl.href
}

function getNoJsHref(url: URL) {
  const debugUrl = new URL(url)
  debugUrl.searchParams.set('__nojs', '1')
  return debugUrl.href
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value > 9999 ? 'compact' : 'standard',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}
