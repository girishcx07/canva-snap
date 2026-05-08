'use server'

let serverCounter = 0
let latestNameInsight: NameInsight | null = null

type AgifyResponse = {
  age: number | null
  count: number
  name: string
}

export type NameInsight = {
  age: number | null
  checkedAt: string
  count: number
  error?: string
  fallback: boolean
  name: string
  source: string
}

export async function getServerCounter() {
  return serverCounter
}

export async function updateServerCounter(change: number) {
  serverCounter += change
}

export async function getLatestNameInsight() {
  return latestNameInsight
}

export async function checkNameAge(formData: FormData) {
  const rawName = formData.get('name')
  const name = typeof rawName === 'string' ? rawName.trim() : ''

  if (!name) {
    latestNameInsight = {
      age: null,
      checkedAt: new Date().toISOString(),
      count: 0,
      error: 'Enter a name before running the server action.',
      fallback: true,
      name: '',
      source: 'https://api.agify.io',
    }
    return
  }

  const source = `https://api.agify.io/?name=${encodeURIComponent(name)}`

  try {
    const response = await fetch(source, {
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as AgifyResponse
    latestNameInsight = {
      age: data.age,
      checkedAt: new Date().toISOString(),
      count: data.count,
      fallback: false,
      name: data.name || name,
      source,
    }
  } catch (error) {
    latestNameInsight = {
      age: null,
      checkedAt: new Date().toISOString(),
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown API error',
      fallback: true,
      name,
      source,
    }
  }
}
