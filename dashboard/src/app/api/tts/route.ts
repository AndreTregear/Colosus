import { NextRequest } from 'next/server'
import { withActiveSubscription } from '@/lib/billing/entitlement'

export const dynamic = 'force-dynamic'

const TTS_URL = process.env.TTS_BASE_URL
  ? `${process.env.TTS_BASE_URL}/v1/audio/speech`
  : 'http://localhost:9400/v1/audio/speech'

async function postImpl(req: NextRequest) {
  try {
    const body = await req.json()

    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kokoro',
        input: body.text,
        voice: body.voice || 'ef_dora',
        lang_code: 'e',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `TTS proxy error: ${error}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const POST = withActiveSubscription(postImpl)
