'use client'

import {
  BookOpenTextIcon,
  ChevronRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileCode2Icon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  GitBranchIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  codeThemeOptions,
  highlightCode,
  type CodeTheme,
  type HighlightedCode,
  type HighlightedToken,
} from '@/lib/code-highlighter'
import { cn } from '@/lib/utils'
import type {
  GitHubBlobPreview,
  GitHubRepoSnapshot,
  RepoNode,
} from '@/repo-data'

type RepoCodeBrowserProps = {
  snapshot: GitHubRepoSnapshot
}

type BlobPreviewState =
  | { status: 'loading' }
  | { preview: GitHubBlobPreview; status: 'ready' }
  | { message: string; status: 'error' }

type HighlightState =
  | { status: 'loading' }
  | (HighlightedCode & { status: 'ready' })
  | { message: string; status: 'error' }

type OpenNode = (node: RepoNode | null) => void

export function RepoCodeBrowser({ snapshot }: RepoCodeBrowserProps) {
  const [blobPreviews, setBlobPreviews] = useState<
    Record<string, BlobPreviewState>
  >({})
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(),
  )
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<CodeTheme>('github-light')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query)
  const allNodes = useMemo(() => collectNodes(snapshot.entries), [snapshot.entries])
  const searchIndex = useMemo(
    () =>
      allNodes.map((node) => ({
        node,
        text: getSearchText(node),
      })),
    [allNodes],
  )

  const selectedNode = useMemo(
    () => (selectedPath ? findNode(snapshot.entries, selectedPath) : null),
    [selectedPath, snapshot.entries],
  )
  const queryText = deferredQuery.trim().toLowerCase()
  const isSearchStale = query.trim() !== deferredQuery.trim()
  const searchResults = useMemo(() => {
    if (!queryText) {
      return []
    }

    return searchIndex
      .filter((item) => item.text.includes(queryText))
      .map((item) => item.node)
  }, [queryText, searchIndex])
  const landingEntries = queryText ? searchResults : snapshot.entries

  function openNode(node: RepoNode | null) {
    setSelectedPath(node?.path ?? null)

    if (!node) {
      return
    }

    setExpandedPaths((current) => {
      const next = new Set(current)

      if (node.type === 'folder') {
        next.add(node.path)
      }

      for (const ancestor of getAncestorPaths(node.path)) {
        next.add(ancestor)
      }

      return next
    })

    if (node.type === 'file') {
      void loadBlobPreview(node)
    }
  }

  async function loadBlobPreview(node: RepoNode) {
    const existingPreview = blobPreviews[node.path]

    if (
      !node.sha ||
      existingPreview?.status === 'loading' ||
      existingPreview?.status === 'ready'
    ) {
      return
    }

    setBlobPreviews((current) => ({
      ...current,
      [node.path]: { status: 'loading' },
    }))

    try {
      const url = new URL('/api/github/blob', window.location.origin)
      url.searchParams.set('owner', snapshot.owner)
      url.searchParams.set('path', node.path)
      url.searchParams.set('repo', snapshot.name)
      url.searchParams.set('sha', node.sha)
      url.searchParams.set('size', String(node.size ?? 0))

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      const preview = (await response.json()) as GitHubBlobPreview

      setBlobPreviews((current) => ({
        ...current,
        [node.path]: { preview, status: 'ready' },
      }))
    } catch (error) {
      setBlobPreviews((current) => ({
        ...current,
        [node.path]: {
          message:
            error instanceof Error ? error.message : 'GitHub blob fetch failed',
          status: 'error',
        },
      }))
    }
  }

  function toggleFolder(path: string) {
    setExpandedPaths((current) => {
      const next = new Set(current)

      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }

      return next
    })
  }

  async function copyPreview(path: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedPath(path)
    window.setTimeout(() => setCopiedPath(null), 1400)
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <RepoHeader
        query={query}
        setQuery={setQuery}
        snapshot={snapshot}
        selectedNode={selectedNode}
        onReset={() => openNode(null)}
      />

      {selectedNode ? (
        <RepoWorkspace
          blobState={blobPreviews[selectedNode.path]}
          copiedPath={copiedPath}
          expandedPaths={expandedPaths}
          isSearchStale={isSearchStale}
          queryText={queryText}
          searchResults={searchResults}
          selectedNode={selectedNode}
          snapshot={snapshot}
          theme={theme}
          onCopyPreview={copyPreview}
          onThemeChange={setTheme}
          onOpenNode={openNode}
          onToggleFolder={toggleFolder}
        />
      ) : (
        <RepoLanding
          entries={landingEntries}
          isSearchStale={isSearchStale}
          queryText={queryText}
          snapshot={snapshot}
          onOpenNode={openNode}
        />
      )}
    </section>
  )
}

function RepoHeader({
  query,
  selectedNode,
  setQuery,
  snapshot,
  onReset,
}: {
  query: string
  selectedNode: RepoNode | null
  setQuery: (value: string) => void
  snapshot: GitHubRepoSnapshot
  onReset: () => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <BookOpenTextIcon className="size-5 shrink-0 text-muted-foreground" />
            <h1 className="min-w-0 text-xl font-semibold tracking-normal sm:text-2xl">
              <span className="text-muted-foreground">{snapshot.owner}</span>
              <span className="text-muted-foreground"> / </span>
              <span>{snapshot.name}</span>
            </h1>
            <Badge variant={snapshot.private ? 'secondary' : 'outline'}>
              {snapshot.private ? 'Private' : 'Public'}
            </Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {snapshot.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm">
            <GitBranchIcon data-icon="inline-start" />
            {snapshot.branch}
          </Button>
          <a
            href={snapshot.htmlUrl}
            target="_blank"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            GitHub
          </a>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReset}
            disabled={!selectedNode}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Files
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search repository"
            className="pl-8"
            placeholder="Search files"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <MiniMetric label="Files" value={formatNumber(snapshot.stats.files)} />
          <MiniMetric
            label="Folders"
            value={formatNumber(snapshot.stats.folders)}
          />
          <MiniMetric label="Size" value={formatBytes(snapshot.stats.bytes)} />
        </div>
      </div>
    </div>
  )
}

function RepoLanding({
  entries,
  isSearchStale,
  queryText,
  snapshot,
  onOpenNode,
}: {
  entries: RepoNode[]
  isSearchStale: boolean
  queryText: string
  snapshot: GitHubRepoSnapshot
  onOpenNode: OpenNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code</CardTitle>
        <CardDescription>
          {isSearchStale
            ? 'Searching...'
            : queryText
            ? `${formatNumber(entries.length)} search matches`
            : `${formatNumber(snapshot.entries.length)} root entries`}
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Repository</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <RepoStatus snapshot={snapshot} />
        <FileList
          entries={entries}
          isPending={isSearchStale}
          showPath={Boolean(queryText)}
          onOpenNode={onOpenNode}
        />
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>Loaded {formatTime(snapshot.generatedAt)}</span>
        <span className="truncate">
          {snapshot.owner}/{snapshot.name}
        </span>
      </CardFooter>
    </Card>
  )
}

function RepoWorkspace({
  blobState,
  copiedPath,
  expandedPaths,
  isSearchStale,
  queryText,
  searchResults,
  selectedNode,
  snapshot,
  theme,
  onCopyPreview,
  onThemeChange,
  onOpenNode,
  onToggleFolder,
}: {
  blobState?: BlobPreviewState
  copiedPath: string | null
  expandedPaths: Set<string>
  isSearchStale: boolean
  queryText: string
  searchResults: RepoNode[]
  selectedNode: RepoNode
  snapshot: GitHubRepoSnapshot
  theme: CodeTheme
  onCopyPreview: (path: string, content: string) => void
  onThemeChange: (theme: CodeTheme) => void
  onOpenNode: OpenNode
  onToggleFolder: (path: string) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
      <Card size="sm" className="lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)]">
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription className="truncate">{snapshot.name}</CardDescription>
          <CardAction>
            <Badge variant="outline">{snapshot.branch}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="min-h-0 overflow-auto">
          {queryText ? (
            <SearchResults
              isPending={isSearchStale}
              results={searchResults}
              onOpenNode={onOpenNode}
            />
          ) : (
            <RepoTree
              entries={snapshot.entries}
              expandedPaths={expandedPaths}
              selectedPath={selectedNode.path}
              onOpenNode={onOpenNode}
              onToggleFolder={onToggleFolder}
            />
          )}
        </CardContent>
      </Card>

      {selectedNode.type === 'folder' ? (
        <FolderView
          entries={snapshot.entries}
          node={selectedNode}
          onOpenNode={onOpenNode}
        />
      ) : (
        <FileView
          blobState={blobState}
          copiedPath={copiedPath}
          entries={snapshot.entries}
          node={selectedNode}
          theme={theme}
          onCopyPreview={onCopyPreview}
          onThemeChange={onThemeChange}
          onOpenNode={onOpenNode}
        />
      )}
    </div>
  )
}

function FolderView({
  entries,
  node,
  onOpenNode,
}: {
  entries: RepoNode[]
  node: RepoNode
  onOpenNode: OpenNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2">
          <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </CardTitle>
        <CardDescription className="truncate">{node.path}</CardDescription>
        <CardAction>
          <Badge variant="outline">Folder</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <BreadcrumbTrail
          entries={entries}
          path={node.path}
          onOpenNode={onOpenNode}
        />
        <FileList
          entries={node.children ?? []}
          showPath={false}
          onOpenNode={onOpenNode}
        />
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatNumber(node.itemCount ?? 0)} entries</span>
        <span>Tree SHA {shortSha(node.sha)}</span>
      </CardFooter>
    </Card>
  )
}

function FileView({
  blobState,
  copiedPath,
  entries,
  node,
  theme,
  onCopyPreview,
  onThemeChange,
  onOpenNode,
}: {
  blobState?: BlobPreviewState
  copiedPath: string | null
  entries: RepoNode[]
  node: RepoNode
  theme: CodeTheme
  onCopyPreview: (path: string, content: string) => void
  onThemeChange: (theme: CodeTheme) => void
  onOpenNode: OpenNode
}) {
  const preview =
    blobState?.status === 'ready' ? blobState.preview : undefined
  const copyContent = preview?.content

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2">
          <FileCode2Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.name}</span>
        </CardTitle>
        <CardDescription className="truncate">{node.path}</CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-2">
          <CodeThemeSelector theme={theme} onThemeChange={onThemeChange} />
          <Badge variant="outline">{node.language}</Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (copyContent) {
                void onCopyPreview(node.path, copyContent)
              }
            }}
            disabled={!copyContent}
          >
            <CopyIcon data-icon="inline-start" />
            {copiedPath === node.path ? 'Copied' : 'Copy'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <BreadcrumbTrail
          entries={entries}
          path={node.path}
          onOpenNode={onOpenNode}
        />
        <FilePreview node={node} state={blobState} theme={theme} />
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatBytes(node.size ?? 0)}</span>
        <span>Blob SHA {shortSha(node.sha)}</span>
      </CardFooter>
    </Card>
  )
}

function FilePreview({
  node,
  state,
  theme,
}: {
  node: RepoNode
  state?: BlobPreviewState
  theme: CodeTheme
}) {
  if (node.type === 'submodule') {
    return (
      <Alert>
        <AlertTitle>Submodule entry</AlertTitle>
        <AlertDescription>
          This entry points at another Git commit, so there is no blob preview.
        </AlertDescription>
      </Alert>
    )
  }

  if (!node.sha) {
    return (
      <Alert>
        <AlertTitle>Missing blob SHA</AlertTitle>
        <AlertDescription>
          GitHub did not return a blob identifier for this file.
        </AlertDescription>
      </Alert>
    )
  }

  if (!state || state.status === 'loading') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTitle>GitHub blob error</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  }

  if (state.preview.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>GitHub blob error</AlertTitle>
        <AlertDescription>{state.preview.error}</AlertDescription>
      </Alert>
    )
  }

  if (state.preview.tooLarge || !state.preview.content) {
    return (
      <Alert>
        <AlertTitle>Preview unavailable</AlertTitle>
        <AlertDescription>
          {node.name} is larger than the inline preview limit.
        </AlertDescription>
      </Alert>
    )
  }

  return <CodePanel node={node} preview={state.preview} theme={theme} />
}

function CodeThemeSelector({
  theme,
  onThemeChange,
}: {
  theme: CodeTheme
  onThemeChange: (theme: CodeTheme) => void
}) {
  return (
    <ToggleGroup
      aria-label="Code theme"
      size="sm"
      value={[theme]}
      variant="outline"
      onValueChange={(value) => {
        const nextTheme = value[0] as CodeTheme | undefined

        if (nextTheme) {
          onThemeChange(nextTheme)
        }
      }}
    >
      {codeThemeOptions.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function CodePanel({
  node,
  preview,
  theme,
}: {
  node: RepoNode
  preview: GitHubBlobPreview
  theme: CodeTheme
}) {
  const content = preview.content ?? ''
  const [highlight, setHighlight] = useState<HighlightState>({
    status: 'loading',
  })

  useEffect(() => {
    let active = true

    async function runHighlight() {
      setHighlight({ status: 'loading' })

      try {
        const result = await highlightCode({
          code: content,
          language: node.highlightLanguage ?? 'text',
          theme,
        })

        if (active) {
          setHighlight({
            background: result.background,
            foreground: result.foreground,
            lines: result.lines,
            status: 'ready',
          })
        }
      } catch (error) {
        if (active) {
          setHighlight({
            message:
              error instanceof Error
                ? error.message
                : 'Syntax highlighting failed',
            status: 'error',
          })
        }
      }
    }

    void runHighlight()

    return () => {
      active = false
    }
  }, [content, node.highlightLanguage, theme])

  if (highlight.status === 'loading') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (highlight.status === 'error') {
    return (
      <PlainCodePanel
        content={content}
        language={node.language ?? 'Plain text'}
        message={highlight.message}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span>{formatNumber(highlight.lines.length)} lines</span>
        <span>{node.language}</span>
      </div>
      <div
        className="max-h-[62svh] overflow-auto font-mono text-[13px] leading-5"
        style={{
          backgroundColor: highlight.background,
          color: highlight.foreground,
        }}
      >
        {highlight.lines.map((line, index) => (
          <div
            key={`${node.path}-${index}`}
            className="grid min-w-max grid-cols-[3.5rem_minmax(40rem,1fr)]"
          >
            <span className="select-none border-r border-border/60 bg-muted/20 px-3 text-right text-muted-foreground">
              {index + 1}
            </span>
            <code className="whitespace-pre px-3">
              {line.length > 0
                ? line.map((token, tokenIndex) => (
                    <span
                      key={`${node.path}-${index}-${tokenIndex}`}
                      style={getTokenStyle(token)}
                    >
                      {token.content}
                    </span>
                  ))
                : ' '}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlainCodePanel({
  content,
  language,
  message,
}: {
  content: string
  language: string
  message: string
}) {
  const lines = content.split('\n')

  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <AlertTitle>Syntax highlighting fallback</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>{formatNumber(lines.length)} lines</span>
          <span>{language}</span>
        </div>
        <div className="max-h-[62svh] overflow-auto font-mono text-[13px] leading-5">
          {lines.map((line, index) => (
            <div
              key={`${language}-${index}`}
              className="grid min-w-max grid-cols-[3.5rem_minmax(40rem,1fr)]"
            >
              <span className="select-none border-r bg-muted/30 px-3 text-right text-muted-foreground">
                {index + 1}
              </span>
              <code className="whitespace-pre px-3">{line || ' '}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RepoStatus({ snapshot }: { snapshot: GitHubRepoSnapshot }) {
  if (snapshot.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>GitHub API error</AlertTitle>
        <AlertDescription>{snapshot.error}</AlertDescription>
      </Alert>
    )
  }

  if (snapshot.truncated) {
    return (
      <Alert>
        <AlertTitle>Tree response truncated</AlertTitle>
        <AlertDescription>
          GitHub limited the recursive tree response for this repository.
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

function FileList({
  entries,
  isPending = false,
  showPath,
  onOpenNode,
}: {
  entries: RepoNode[]
  isPending?: boolean
  showPath: boolean
  onOpenNode: OpenNode
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
        No entries found
      </div>
    )
  }

  return (
    <div
      aria-busy={isPending}
      className={cn(
        'overflow-hidden rounded-lg border transition-opacity',
        isPending && 'opacity-60',
      )}
    >
      <div className="hidden grid-cols-[minmax(0,1fr)_7rem_8rem] gap-3 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
        <span>Name</span>
        <span>Size</span>
        <span>Kind</span>
      </div>
      <div className="divide-y">
        {entries.map((entry) => (
          <button
            key={entry.path}
            type="button"
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_7rem_8rem]"
            onClick={() => onOpenNode(entry)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <EntryIcon node={entry} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{entry.name}</span>
                {showPath ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.path}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="text-xs text-muted-foreground sm:text-sm">
              {entry.type === 'folder'
                ? `${formatNumber(entry.itemCount ?? 0)} items`
                : formatBytes(entry.size ?? 0)}
            </span>
            <span className="hidden capitalize text-muted-foreground sm:block">
              {entry.type}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function RepoTree({
  entries,
  expandedPaths,
  selectedPath,
  depth = 0,
  onOpenNode,
  onToggleFolder,
}: {
  depth?: number
  entries: RepoNode[]
  expandedPaths: Set<string>
  selectedPath: string
  onOpenNode: OpenNode
  onToggleFolder: (path: string) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map((entry) => {
        const isFolder = entry.type === 'folder'
        const isSelected = entry.path === selectedPath
        const isExpanded =
          isFolder &&
          (expandedPaths.has(entry.path) || isAncestorPath(entry.path, selectedPath))

        return (
          <div key={entry.path} className="flex flex-col gap-0.5">
            <button
              type="button"
              aria-expanded={isFolder ? isExpanded : undefined}
              className={cn(
                'flex h-8 w-full min-w-0 items-center gap-1.5 rounded-md pr-2 text-left text-sm transition-colors hover:bg-muted',
                isSelected && 'bg-muted font-medium',
              )}
              style={{ paddingLeft: depth * 12 + 8 }}
              onClick={() => {
                if (isFolder) {
                  onToggleFolder(entry.path)
                }

                onOpenNode(entry)
              }}
            >
              {isFolder ? (
                <ChevronRightIcon
                  className={cn(
                    'size-3 shrink-0 text-muted-foreground transition-transform',
                    isExpanded && 'rotate-90',
                  )}
                />
              ) : (
                <span className="size-3 shrink-0" />
              )}
              <EntryIcon node={entry} />
              <span className="truncate">{entry.name}</span>
            </button>
            {isExpanded ? (
              <RepoTree
                entries={entry.children ?? []}
                expandedPaths={expandedPaths}
                selectedPath={selectedPath}
                depth={depth + 1}
                onOpenNode={onOpenNode}
                onToggleFolder={onToggleFolder}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function SearchResults({
  isPending,
  results,
  onOpenNode,
}: {
  isPending: boolean
  results: RepoNode[]
  onOpenNode: OpenNode
}) {
  if (results.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
        No matches
      </div>
    )
  }

  return (
    <div
      aria-busy={isPending}
      className={cn('flex flex-col gap-1 transition-opacity', isPending && 'opacity-60')}
    >
      {results.map((node) => (
        <button
          key={node.path}
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
          onClick={() => onOpenNode(node)}
        >
          <EntryIcon node={node} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{node.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {node.path}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

function BreadcrumbTrail({
  entries,
  path,
  onOpenNode,
}: {
  entries: RepoNode[]
  path: string
  onOpenNode: OpenNode
}) {
  const crumbs = getBreadcrumbs(path, entries)

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        className="rounded-md px-1.5 py-1 font-medium hover:bg-muted"
        onClick={() => onOpenNode(null)}
      >
        root
      </button>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex min-w-0 items-center gap-1">
          <ChevronRightIcon className="size-3 text-muted-foreground" />
          <button
            type="button"
            className="max-w-44 truncate rounded-md px-1.5 py-1 font-medium hover:bg-muted"
            onClick={() => onOpenNode(crumb.node)}
          >
            {crumb.node.name}
          </button>
        </span>
      ))}
    </div>
  )
}

function EntryIcon({ node }: { node: RepoNode }) {
  if (node.type === 'folder') {
    return <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
  }

  if (node.type === 'submodule') {
    return <FileIcon className="size-4 shrink-0 text-muted-foreground" />
  }

  if (node.language && node.language !== 'Plain text') {
    return <FileCode2Icon className="size-4 shrink-0 text-muted-foreground" />
  }

  return <FileIcon className="size-4 shrink-0 text-muted-foreground" />
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function findNode(entries: RepoNode[], targetPath: string): RepoNode | null {
  for (const entry of entries) {
    if (entry.path === targetPath) {
      return entry
    }

    if (entry.type === 'folder') {
      const child = findNode(entry.children ?? [], targetPath)

      if (child) {
        return child
      }
    }
  }

  return null
}

function collectNodes(entries: RepoNode[]): RepoNode[] {
  return entries.flatMap((entry) =>
    entry.type === 'folder' ? [entry, ...collectNodes(entry.children ?? [])] : [entry],
  )
}

function getBreadcrumbs(targetPath: string, entries: RepoNode[]) {
  const parts = targetPath.split('/')
  const crumbs: { node: RepoNode; path: string }[] = []

  for (let index = 0; index < parts.length; index += 1) {
    const crumbPath = parts.slice(0, index + 1).join('/')
    const node = findNode(entries, crumbPath)

    if (node) {
      crumbs.push({ node, path: crumbPath })
    }
  }

  return crumbs
}

function getAncestorPaths(targetPath: string) {
  const parts = targetPath.split('/')
  const ancestors: string[] = []

  for (let index = 1; index < parts.length; index += 1) {
    ancestors.push(parts.slice(0, index).join('/'))
  }

  return ancestors
}

function isAncestorPath(folderPath: string, targetPath: string) {
  return targetPath.startsWith(`${folderPath}/`)
}

function getSearchText(node: RepoNode) {
  return `${node.name} ${node.path} ${node.language ?? ''}`.toLowerCase()
}

function getTokenStyle(token: HighlightedToken): CSSProperties {
  const style: CSSProperties = {}

  if (token.color) {
    style.color = token.color
  }

  if (token.fontStyle) {
    if (token.fontStyle & 1) {
      style.fontStyle = 'italic'
    }

    if (token.fontStyle & 2) {
      style.fontWeight = 600
    }

    if (token.fontStyle & 4) {
      style.textDecoration = 'underline'
    }
  }

  return style
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en').format(value)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function shortSha(value?: string) {
  return value ? value.slice(0, 7) : 'unknown'
}
