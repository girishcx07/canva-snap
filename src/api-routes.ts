import { getGitHubBlobPreview } from './repo-data'

type ApiRouteHandler = (input: {
  request: Request
  url: URL
}) => Promise<Response> | Response

type ApiRoute = {
  handler: ApiRouteHandler
  method: 'GET'
  path: string
}

const apiRoutes: ApiRoute[] = [
  {
    handler: handleGitHubBlobApi,
    method: 'GET',
    path: '/api/github/blob',
  },
]

export async function handleApiRoute(request: Request, url: URL) {
  const route = apiRoutes.find((item) => item.path === url.pathname)

  if (!route) {
    return null
  }

  if (request.method !== route.method) {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        allow: route.method,
      },
    })
  }

  return route.handler({ request, url })
}

async function handleGitHubBlobApi({ url }: { request: Request; url: URL }) {
  const owner = url.searchParams.get('owner')
  const path = url.searchParams.get('path')
  const repo = url.searchParams.get('repo')
  const sha = url.searchParams.get('sha')
  const size = Number(url.searchParams.get('size') ?? '0')

  if (!owner || !path || !repo || !sha) {
    return Response.json(
      { error: 'Missing owner, repo, path, or sha query parameter.' },
      { status: 400 },
    )
  }

  const preview = await getGitHubBlobPreview({
    owner,
    path,
    repo,
    sha,
    size: Number.isFinite(size) ? size : undefined,
  })

  return Response.json(preview, {
    headers: {
      'cache-control': 'private, max-age=60',
    },
  })
}
