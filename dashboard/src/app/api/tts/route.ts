import { NextRequest } from 'next/server'
import { withActiveSubscription } from '@/lib/billing/entitlement'

export const dynamic = 'force-dynamic'

// Kokoro TTS endpoint per INFRA.md (`:8002`, bearer `welcometothepresent`).
// Override via YAYA_TTS_URL / YAYA_TTS_KEY (legacy TTS_BASE_URL also honored).
const TTS_BASE = (process.env.YAYA_TTS_URL || process.env.TTS_BASE_URL || 'http://localhost:8002').replace(/\/+$/, '')
const TTS_URL = `${TTS_BASE}/v1/audio/speech`
const TTS_KEY = process.env.YAYA_TTS_KEY || process.env.TTS_API_KEY || 'welcometothepresent'

async function postImpl(req: NextRequest) {
  try {
    const body = await req.json()

    const response = await fetch(TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_KEY}`,
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
