type ApiResult<T> = {
  data: T
  error?: string
  fetchedAt: string
  fallback: boolean
  source: string
}

export type RepoSnapshot = {
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
}

export type Todo = {
  id: number
  title: string
  completed: boolean
  userId: number
}

const repoFallback: RepoSnapshot = {
  full_name: 'vitejs/vite',
  description: 'Next generation frontend tooling.',
  html_url: 'https://github.com/vitejs/vite',
  stargazers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  pushed_at: new Date(0).toISOString(),
}

const todosFallback: Todo[] = [
  {
    id: 1,
    title: 'Render server data as an RSC payload',
    completed: true,
    userId: 1,
  },
  {
    id: 2,
    title: 'Hydrate a small client island',
    completed: false,
    userId: 1,
  },
  {
    id: 3,
    title: 'Submit a server action without an API route',
    completed: true,
    userId: 2,
  },
]

async function fetchJson<T>(
  source: string,
  fallback: T,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(source, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
        ...init?.headers,
      },
      ...init,
    })

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    return {
      data: (await response.json()) as T,
      fetchedAt: new Date().toISOString(),
      fallback: false,
      source,
    }
  } catch (error) {
    return {
      data: fallback,
      error: error instanceof Error ? error.message : 'Unknown API error',
      fetchedAt: new Date().toISOString(),
      fallback: true,
      source,
    }
  }
}

export function getSsrRepoSnapshot() {
  return fetchJson<RepoSnapshot>(
    'https://api.github.com/repos/vitejs/vite',
    repoFallback,
    {
      headers: {
        accept: 'application/vnd.github+json',
      },
    },
  )
}

export function getRscTodos() {
  return fetchJson<Todo[]>(
    'https://jsonplaceholder.typicode.com/todos?_limit=6',
    todosFallback,
  )
}
