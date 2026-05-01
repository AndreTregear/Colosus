/**
 * Chat API — Mastra supervisor agent with real streaming.
 *
 * No process spawning. No session locks. Direct agent.stream().
 * Supervisor delegates to specialized workers (metrics, scheduling, messaging, research).
 * Auto model fallback via Mastra's AI SDK integration.
 *
 * Gated by withActiveSubscription: requires an authenticated Better Auth
 * session AND an active agente_ceo_subscriptions row.
 */

import { NextRequest } from 'next/server'
import { directAgent } from '@/mastra'
import { withActiveSubscription } from '@/lib/billing/entitlement'

export const dynamic = 'force-dynamic'

export const POST = withActiveSubscription(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { messages } = body

    // Get the last user message as the prompt
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    if (!lastUserMsg) {
      return new Response(JSON.stringify({ error: 'No user message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build context from recent history
    const history = messages.slice(0, -1)
    const context = history
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 500),
      }))

    // Stream from the direct agent (all tools, no delegation overhead)
    const result = await directAgent.stream(lastUserMsg.content, {
      maxSteps: 4,
      context,
    })

    // Convert Mastra's stream to SSE format the frontend expects
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const sseData = JSON.stringify({
              id: `chat-${Date.now()}`,
              object: 'chat.completion.chunk',
              model: 'mastra-supervisor',
              choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
            })
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
          }
        } catch (err) {
          const errorChunk = JSON.stringify({
            id: `err-${Date.now()}`,
            object: 'chat.completion.chunk',
            choices: [{ index: 0, delta: { content: `Error: ${err instanceof Error ? err.message : err}` }, finish_reason: null }],
          })
          controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Chat error: ${error}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
