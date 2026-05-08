export type RepoNodeType = 'file' | 'folder' | 'submodule'

export type RepoNode = {
  children?: RepoNode[]
  extension?: string
  highlightLanguage?: string
  itemCount?: number
  language?: string
  mode?: string
  name: string
  path: string
  sha?: string
  size?: number
  type: RepoNodeType
  updatedAt?: string
  url?: string
}

export type GitHubRepoSnapshot = {
  api: {
    blobsUrl: string
    repoUrl: string
    treeUrl: string
  }
  branch: string
  description: string
  entries: RepoNode[]
  error?: string
  generatedAt: string
  htmlUrl: string
  name: string
  owner: string
  private: boolean
  stats: {
    bytes: number
    files: number
    folders: number
    lines: number
    submodules: number
  }
  truncated: boolean
}

export type GitHubBlobPreview = {
  content?: string
  encoding?: string
  error?: string
  lines?: number
  path: string
  sha: string
  size: number
  source: string
  tooLarge: boolean
}

type GitHubRepoResponse = {
  blobs_url: string
  default_branch: string
  description: string | null
  forks_count: number
  full_name: string
  html_url: string
  name: string
  open_issues_count: number
  owner: {
    login: string
  }
  private: boolean
  pushed_at: string
  stargazers_count: number
  trees_url: string
}

type GitHubTreeResponse = {
  sha: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

type GitHubTreeItem = {
  mode: string
  path: string
  sha: string
  size?: number
  type: 'blob' | 'commit' | 'tree'
  url: string
}

type GitHubBlobResponse = {
  content: string
  encoding: string
  sha: string
  size: number
  url: string
}

type MutableFolder = RepoNode & {
  children: RepoNode[]
  folders: Map<string, MutableFolder>
}

const defaultOwner = 'vitejs'
const defaultRepo = 'vite'
const maxBlobPreviewBytes = 120_000
const cacheTtlMs = 1000 * 60 * 5
const blobCacheTtlMs = 1000 * 60 * 10

const blobPreviewCache = new Map<
  string,
  { expiresAt: number; preview: GitHubBlobPreview }
>()
const repoSnapshotCache = new Map<
  string,
  { expiresAt: number; snapshot: GitHubRepoSnapshot }
>()

const languageByExtension: Record<string, { label: string; shiki: string }> = {
  '.astro': { label: 'Astro', shiki: 'astro' },
  '.bash': { label: 'Bash', shiki: 'bash' },
  '.c': { label: 'C', shiki: 'c' },
  '.cjs': { label: 'JavaScript', shiki: 'javascript' },
  '.cpp': { label: 'C++', shiki: 'cpp' },
  '.css': { label: 'CSS', shiki: 'css' },
  '.go': { label: 'Go', shiki: 'go' },
  '.html': { label: 'HTML', shiki: 'html' },
  '.java': { label: 'Java', shiki: 'java' },
  '.js': { label: 'JavaScript', shiki: 'javascript' },
  '.json': { label: 'JSON', shiki: 'json' },
  '.jsx': { label: 'React JSX', shiki: 'jsx' },
  '.md': { label: 'Markdown', shiki: 'markdown' },
  '.mdx': { label: 'MDX', shiki: 'mdx' },
  '.mjs': { label: 'JavaScript', shiki: 'javascript' },
  '.mts': { label: 'TypeScript', shiki: 'typescript' },
  '.php': { label: 'PHP', shiki: 'php' },
  '.py': { label: 'Python', shiki: 'python' },
  '.rb': { label: 'Ruby', shiki: 'ruby' },
  '.rs': { label: 'Rust', shiki: 'rust' },
  '.scss': { label: 'SCSS', shiki: 'scss' },
  '.sh': { label: 'Shell', shiki: 'shellscript' },
  '.svelte': { label: 'Svelte', shiki: 'svelte' },
  '.svg': { label: 'SVG', shiki: 'xml' },
  '.toml': { label: 'TOML', shiki: 'toml' },
  '.ts': { label: 'TypeScript', shiki: 'typescript' },
  '.tsx': { label: 'React TSX', shiki: 'tsx' },
  '.txt': { label: 'Text', shiki: 'text' },
  '.vue': { label: 'Vue', shiki: 'vue' },
  '.yaml': { label: 'YAML', shiki: 'yaml' },
  '.yml': { label: 'YAML', shiki: 'yaml' },
}

const languageByFileName: Record<string, { label: string; shiki: string }> = {
  '.dockerignore': { label: 'Docker ignore', shiki: 'text' },
  '.env': { label: 'Environment', shiki: 'dotenv' },
  '.env.example': { label: 'Environment', shiki: 'dotenv' },
  '.gitattributes': { label: 'Git attributes', shiki: 'text' },
  '.gitignore': { label: 'Git ignore', shiki: 'text' },
  Dockerfile: { label: 'Dockerfile', shiki: 'dockerfile' },
  Makefile: { label: 'Makefile', shiki: 'makefile' },
}

export async function getGitHubRepoSnapshot(
  owner = defaultOwner,
  repo = defaultRepo,
): Promise<GitHubRepoSnapshot> {
  const cacheKey = `${owner}/${repo}`
  const cached = repoSnapshotCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot
  }

  const repoUrl = createGitHubApiUrl(`/repos/${owner}/${repo}`)

  try {
    const repository = await fetchGitHubJson<GitHubRepoResponse>(repoUrl)
    const branch = repository.default_branch
    const treeUrl = createGitHubApiUrl(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}`,
      { recursive: '1' },
    )
    const tree = await fetchGitHubJson<GitHubTreeResponse>(treeUrl)
    const entries = buildTree(tree.tree, repository.pushed_at)
    const stats = summarizeEntries(entries)

    const snapshot = {
      api: {
        blobsUrl: repository.blobs_url,
        repoUrl,
        treeUrl,
      },
      branch,
      description:
        repository.description ?? 'Repository code browser powered by GitHub APIs.',
      entries,
      generatedAt: new Date().toISOString(),
      htmlUrl: repository.html_url,
      name: repository.name,
      owner: repository.owner.login,
      private: repository.private,
      stats,
      truncated: tree.truncated,
    }

    repoSnapshotCache.set(cacheKey, {
      expiresAt: Date.now() + cacheTtlMs,
      snapshot,
    })

    return snapshot
  } catch (error) {
    if (cached) {
      return {
        ...cached.snapshot,
        error: `Using cached tree; latest GitHub API request failed: ${
          error instanceof Error ? error.message : 'GitHub API request failed'
        }`,
      }
    }

    return createFallbackSnapshot(owner, repo, repoUrl, error)
  }
}

export async function getGitHubBlobPreview(input: {
  owner: string
  path: string
  repo: string
  sha: string
  size?: number
}): Promise<GitHubBlobPreview> {
  const source = createGitHubApiUrl(
    `/repos/${input.owner}/${input.repo}/git/blobs/${input.sha}`,
  )
  const cacheKey = `${input.owner}/${input.repo}/${input.sha}`
  const cached = blobPreviewCache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.preview
  }

  if ((input.size ?? 0) > maxBlobPreviewBytes) {
    return {
      path: input.path,
      sha: input.sha,
      size: input.size ?? 0,
      source,
      tooLarge: true,
    }
  }

  try {
    const blob = await fetchGitHubJson<GitHubBlobResponse>(source)
    const content = decodeGitHubBlob(blob)

    const preview = {
      content,
      encoding: blob.encoding,
      lines: countLines(content),
      path: input.path,
      sha: blob.sha,
      size: blob.size,
      source: blob.url,
      tooLarge: blob.size > maxBlobPreviewBytes,
    }

    blobPreviewCache.set(cacheKey, {
      expiresAt: Date.now() + blobCacheTtlMs,
      preview,
    })

    return preview
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'GitHub blob fetch failed',
      path: input.path,
      sha: input.sha,
      size: input.size ?? 0,
      source,
      tooLarge: false,
    }
  }
}

function buildTree(items: GitHubTreeItem[], updatedAt: string) {
  const root: MutableFolder = {
    children: [],
    folders: new Map(),
    name: '',
    path: '',
    type: 'folder',
  }

  for (const item of items) {
    const parts = item.path.split('/').filter(Boolean)
    const name = parts.at(-1)

    if (!name) {
      continue
    }

    const parent = ensureParentFolder(root, parts.slice(0, -1), updatedAt)

    if (item.type === 'tree') {
      const folder = ensureFolder(parent, name, item.path, updatedAt)
      folder.mode = item.mode
      folder.sha = item.sha
      folder.url = item.url
      continue
    }

    parent.children.push({
      extension: getExtension(name),
      highlightLanguage: getHighlightLanguage(name),
      language: getLanguage(name),
      mode: item.mode,
      name,
      path: item.path,
      sha: item.sha,
      size: item.size,
      type: item.type === 'commit' ? 'submodule' : 'file',
      updatedAt,
      url: item.url,
    })
  }

  finalizeFolders(root.children)

  return root.children.sort(compareRepoNodes)
}

function ensureParentFolder(
  root: MutableFolder,
  parts: string[],
  updatedAt: string,
) {
  let current = root

  for (let index = 0; index < parts.length; index += 1) {
    const folderPath = parts.slice(0, index + 1).join('/')
    current = ensureFolder(current, parts[index], folderPath, updatedAt)
  }

  return current
}

function ensureFolder(
  parent: MutableFolder,
  name: string,
  folderPath: string,
  updatedAt: string,
) {
  const existing = parent.folders.get(folderPath)

  if (existing) {
    return existing
  }

  const folder: MutableFolder = {
    children: [],
    folders: new Map(),
    itemCount: 0,
    name,
    path: folderPath,
    type: 'folder',
    updatedAt,
  }

  parent.folders.set(folderPath, folder)
  parent.children.push(folder)

  return folder
}

function finalizeFolders(entries: RepoNode[]) {
  for (const entry of entries) {
    if (entry.type === 'folder') {
      finalizeFolders(entry.children ?? [])
      entry.children = (entry.children ?? []).sort(compareRepoNodes)
      entry.itemCount = entry.children.length
      delete (entry as MutableFolder).folders
    }
  }
}

function summarizeEntries(entries: RepoNode[]) {
  const stats = {
    bytes: 0,
    files: 0,
    folders: 0,
    lines: 0,
    submodules: 0,
  }

  function visit(nodes: RepoNode[]) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        stats.folders += 1
        visit(node.children ?? [])
      } else if (node.type === 'submodule') {
        stats.submodules += 1
      } else {
        stats.bytes += node.size ?? 0
        stats.files += 1
      }
    }
  }

  visit(entries)

  return stats
}

function createFallbackSnapshot(
  owner: string,
  repo: string,
  repoUrl: string,
  error: unknown,
): GitHubRepoSnapshot {
  return {
    api: {
      blobsUrl: `https://api.github.com/repos/${owner}/${repo}/git/blobs{/sha}`,
      repoUrl,
      treeUrl: `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
    },
    branch: 'main',
    description: 'Repository data is unavailable right now.',
    entries: [],
    error: error instanceof Error ? error.message : 'GitHub API request failed',
    generatedAt: new Date().toISOString(),
    htmlUrl: `https://github.com/${owner}/${repo}`,
    name: repo,
    owner,
    private: false,
    stats: {
      bytes: 0,
      files: 0,
      folders: 0,
      lines: 0,
      submodules: 0,
    },
    truncated: false,
  }
}

async function fetchGitHubJson<T>(source: string): Promise<T> {
  const headers = new Headers({
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  })
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN

  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  const response = await fetch(source, {
    cache: 'no-store',
    headers,
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

function decodeGitHubBlob(blob: GitHubBlobResponse) {
  if (blob.size > maxBlobPreviewBytes) {
    return ''
  }

  if (blob.encoding !== 'base64') {
    return blob.content
  }

  const normalized = blob.content.replace(/\n/g, '')
  return Buffer.from(normalized, 'base64').toString('utf8')
}

function createGitHubApiUrl(
  path: string,
  searchParams?: Record<string, string>,
) {
  const url = new URL(path, 'https://api.github.com')

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}

function compareRepoNodes(a: RepoNode, b: RepoNode) {
  if (a.type !== b.type) {
    if (a.type === 'folder') {
      return -1
    }

    if (b.type === 'folder') {
      return 1
    }
  }

  return a.name.localeCompare(b.name)
}

function countLines(content: string) {
  if (!content) {
    return 0
  }

  return content.split('\n').length
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf('.')

  if (index < 0) {
    return ''
  }

  return fileName.slice(index)
}

function getLanguage(fileName: string) {
  return (
    languageByFileName[fileName]?.label ??
    languageByExtension[getExtension(fileName)]?.label ??
    'Plain text'
  )
}

function getHighlightLanguage(fileName: string) {
  return (
    languageByFileName[fileName]?.shiki ??
    languageByExtension[getExtension(fileName)]?.shiki ??
    'text'
  )
}
