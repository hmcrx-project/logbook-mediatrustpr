export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

export function errorResponse(message, status = 400, details = undefined) {
  return json(
    {
      ok: false,
      error: message,
      ...(details ? { details } : {}),
    },
    status,
  )
}

export async function readJson(request) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'Content-Type harus application/json.')
  }

  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Body JSON tidak valid.')
  }
}

export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function withCors(response, request, env) {
  const headers = new Headers(response.headers)
  const requestOrigin = request.headers.get('origin')
  const configuredOrigin = env.FRONTEND_ORIGIN || ''
  const allowedOrigins = new Set([
    configuredOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean))

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    headers.set('access-control-allow-origin', requestOrigin)
    headers.set('vary', 'Origin')
  }

  headers.set('access-control-allow-credentials', 'true')
  headers.set('access-control-allow-headers', 'Content-Type, X-Setup-Key')
  headers.set('access-control-allow-methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  headers.set('access-control-max-age', '86400')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
