'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Bot, Copy, Volume2 } from 'lucide-react'
import { TypingIndicator } from './TypingIndicator'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onTTS: (text: string) => void
}

export function MessageList({ messages, isStreaming, onTTS }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-emerald-500/20 border border-border/50 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">How can I help you?</h2>
          <p className="text-muted-foreground text-sm">
            Start a conversation with your AI models. Select a model from the dropdown above and type your message below.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.filter(m => m.role !== 'system').map((message) => (
        <MessageBubble key={message.id} message={message} onTTS={onTTS} />
      ))}
      {isStreaming && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex gap-3 max-w-3xl mx-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="glass-card px-4 py-2">
            <TypingIndicator />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({ message, onTTS }: { message: ChatMessage; onTTS: (text: string) => void }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 max-w-3xl mx-auto ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-secondary border border-border'
            : 'bg-gradient-to-br from-purple-500 to-cyan-500'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block text-left max-w-full rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary/15 border border-primary/20'
              : 'glass-card'
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeStr = String(children).replace(/\n$/, '')
                  if (match) {
                    return (
                      <div className="relative group my-3">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] rounded-t-lg border-b border-white/5">
                          <span className="text-xs text-muted-foreground">{match[1]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeStr)}
                            className="text-muted-foreground hover:text-foreground smooth-transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            background: '#1e1e2e',
                          }}
                        >
                          {codeStr}
                        </SyntaxHighlighter>
                      </div>
                    )
                  }
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-secondary text-sm font-mono" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Action buttons for assistant messages */}
        {!isUser && message.content && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="text-muted-foreground hover:text-foreground smooth-transition p-1"
              title="Copy message"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTTS(message.content)}
              className="text-muted-foreground hover:text-foreground smooth-transition p-1"
              title="Read aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
