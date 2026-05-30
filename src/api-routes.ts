// Extensible API route registry. Demo GitHub endpoints were removed with the
// rest of the demo content; presentation/asset endpoints can register here.

type ApiRouteHandler = (input: {
  request: Request
  url: URL
}) => Promise<Response> | Response

type ApiRoute = {
  handler: ApiRouteHandler
  method: 'GET' | 'POST'
  path: string
}

const apiRoutes: ApiRoute[] = []

export async function handleApiRoute(request: Request, url: URL) {
  const route = apiRoutes.find((item) => item.path === url.pathname)

  if (!route) {
    return null
  }

  if (request.method !== route.method) {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: route.method },
    })
  }

  return route.handler({ request, url })
}
