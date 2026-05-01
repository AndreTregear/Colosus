'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DEFAULT_MODEL_ID } from '@/lib/models'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { MessageList, type ChatMessage } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatSidebar, type ChatSession } from '@/components/chat/ChatSidebar'

interface StoredChat {
  id: string
  title: string
  messages: ChatMessage[]
  modelId: string
  timestamp: number
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadChats(): StoredChat[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('agente-chats')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveChats(chats: StoredChat[]) {
  localStorage.setItem('agente-chats', JSON.stringify(chats))
}

export default function ChatPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [chatId, setChatId] = useState<string>(generateId())
  const [chats, setChats] = useState<StoredChat[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // Auth check
  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push('/login')
      } else {
        setReady(true)
        setChats(loadChats())
      }
    })
  }, [router])

  // Save current chat to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    setChats((prev) => {
      const existing = prev.findIndex((c) => c.id === chatId)
      const title =
        messages.find((m) => m.role === 'user')?.content.slice(0, 60) || 'New Chat'
      const chat: StoredChat = {
        id: chatId,
        title,
        messages,
        modelId,
        timestamp: Date.now(),
      }
      const updated = existing >= 0
        ? prev.map((c) => (c.id === chatId ? chat : c))
        : [chat, ...prev]
      saveChats(updated)
      return updated
    })
  }, [messages, chatId, modelId])

  const sessions: ChatSession[] = chats.map((c) => ({
    id: c.id,
    title: c.title,
    timestamp: c.timestamp,
    preview: c.messages[c.messages.length - 1]?.content.slice(0, 80) || '',
  }))

  function handleNewChat() {
    abortRef.current?.abort()
    setMessages([])
    setChatId(generateId())
    setIsStreaming(false)
  }

  function handleSelectSession(id: string) {
    abortRef.current?.abort()
    setIsStreaming(false)
    const chat = chats.find((c) => c.id === id)
    if (chat) {
      setChatId(chat.id)
      setMessages(chat.messages)
      setModelId(chat.modelId)
    }
  }

  function handleDeleteSession(id: string) {
    const updated = chats.filter((c) => c.id !== id)
    setChats(updated)
    saveChats(updated)
    if (id === chatId) {
      handleNewChat()
    }
  }

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setIsStreaming(true)

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      const abortController = new AbortController()
      abortRef.current = abortController

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId,
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortController.signal,
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        // Add the empty assistant message
        setMessages([...updatedMessages, assistantMessage])

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data: ')) continue
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                fullContent += delta
                setMessages((prev) => {
                  const copy = [...prev]
                  const last = copy[copy.length - 1]
                  if (last && last.id === assistantMessage.id) {
                    copy[copy.length - 1] = { ...last, content: fullContent }
                  }
                  return copy
                })
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        const errorContent = `Error: ${(err as Error).message}`
        setMessages((prev) => {
          const copy = [...prev]
          const last = copy[copy.length - 1]
          if (last && last.role === 'assistant' && !last.content) {
            copy[copy.length - 1] = { ...last, content: errorContent }
          } else {
            copy.push({
              id: generateId(),
              role: 'assistant',
              content: errorContent,
              timestamp: Date.now(),
            })
          }
          return copy
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, modelId]
  )

  async function handleTTS(text: string) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 4096) }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {
      // TTS unavailable
    }
  }

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center animated-gradient">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background/50">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={chatId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/60 backdrop-blur-lg">
          <ModelSelector selectedModelId={modelId} onSelect={setModelId} />
          {isStreaming && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 smooth-transition"
            >
              Stop generating
            </button>
          )}
        </div>

        {/* Messages */}
        <MessageList messages={messages} isStreaming={isStreaming} onTTS={handleTTS} />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  )
}
