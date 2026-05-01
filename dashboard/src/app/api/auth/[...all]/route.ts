import { NextRequest } from 'next/server'

const AUTH_BACKEND = process.env.AUTH_BACKEND_URL || 'http://localhost:3000'

async function proxyToAuth(req: NextRequest) {
  const url = new URL(req.url)
  const targetUrl = `${AUTH_BACKEND}${url.pathname}${url.search}`

  const headers = new Headers()
  headers.set('Content-Type', req.headers.get('Content-Type') || 'application/json')
  
  // Forward cookie
  const cookie = req.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)
  
  // Forward Origin/Referer — Better Auth needs these for CSRF protection
  const origin = req.headers.get('origin')
  if (origin) headers.set('origin', origin)
  const referer = req.headers.get('referer')
  if (referer) headers.set('referer', referer)

  const init: RequestInit = {
    method: req.method,
    headers,
    credentials: 'include',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  const response = await fetch(targetUrl, init)

  const responseHeaders = new Headers()
  response.headers.forEach((value, key) => {
    if (
      key.toLowerCase() === 'set-cookie' ||
      key.toLowerCase() === 'content-type'
    ) {
      responseHeaders.append(key, value)
    }
  })

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function GET(req: NextRequest) {
  return proxyToAuth(req)
}

export async function POST(req: NextRequest) {
  return proxyToAuth(req)
}
