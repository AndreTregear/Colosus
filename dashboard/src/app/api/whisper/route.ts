import { NextRequest } from 'next/server'
import { withActiveSubscription } from '@/lib/billing/entitlement'

export const dynamic = 'force-dynamic'

const WHISPER_URL = process.env.WHISPER_BASE_URL
  ? `${process.env.WHISPER_BASE_URL}/audio/transcriptions`
  : 'http://localhost:9300/v1/audio/transcriptions'
const WHISPER_KEY = process.env.WHISPER_API_KEY || ''

async function postImpl(req: NextRequest) {
  try {
    const formData = await req.formData()

    const response = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHISPER_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: err }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Whisper proxy error: ${error}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const POST = withActiveSubscription(postImpl)
