import './index.css'

import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react'

import {
  checkNameAge,
  getLatestNameInsight,
  getServerCounter,
  updateServerCounter,
} from './action.tsx'
import type { NameInsight } from './action.tsx'
import { ClientApiPanel } from './components/demo/client-api-panel.tsx'
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
import { getRscTodos, getSsrRepoSnapshot, type Todo } from './server-data'

export function Root(props: { url: URL }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React RSC API Lab</title>
      </head>
      <body>
        <App {...props} />
      </body>
    </html>
  )
}

async function App(props: { url: URL }) {
  const [repo, todos, serverCounter, latestNameInsight] = await Promise.all([
    getSsrRepoSnapshot(),
    getRscTodos(),
    getServerCounter(),
    getLatestNameInsight(),
  ])

  return (
    <main className="min-h-svh bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-3xl flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Vite RSC</Badge>
                <Badge variant="outline">React 19</Badge>
                <Badge variant="outline">shadcn base-nova</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  React server features with real API boundaries
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  One Vite app showing SSR HTML, RSC data, a hydrated client
                  island, and server actions without API keys.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <a
                href="./_.rsc"
                target="_blank"
                className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 font-medium hover:bg-muted"
              >
                Flight payload
                <ArrowUpRightIcon className="size-4" />
              </a>
              <a
                href="?__nojs"
                target="_blank"
                className="inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 font-medium hover:bg-muted"
              >
                No JS render
                <ArrowUpRightIcon className="size-4" />
              </a>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p>Request: {props.url.href}</p>
            <p>Rendered: {formatTime(new Date().toISOString())}</p>
            <p>RSC endpoint: {new URL('./_.rsc', props.url).href}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8">
        <SsrCard repo={repo} />
        <RscCard todos={todos} />
        <ClientApiPanel />
        <ServerActionCard
          insight={latestNameInsight}
          serverCounter={serverCounter}
        />
      </section>
    </main>
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

function Metric({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-medium">{value}</p>
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
