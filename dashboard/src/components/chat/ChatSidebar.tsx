'use client'

import { useState } from 'react'
import { Plus, MessageSquare, Trash2, Zap, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export interface ChatSession {
  id: string
  title: string
  timestamp: number
  preview: string
}

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatSidebarProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (collapsed) {
    return (
      <div className="w-16 flex flex-col items-center py-4 gap-4 sidebar-premium border-r border-border/50 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition"
          title="Expand sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition"
          title="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary smooth-transition"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 flex flex-col sidebar-premium border-r border-border/50 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">agente.ceo</span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary smooth-transition"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onNewChat}
          className="w-full btn-gradient py-2.5 text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer smooth-transition ${
                session.id === activeSessionId
                  ? 'bg-secondary/60 border border-border/50'
                  : 'hover:bg-secondary/30'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{session.title}</div>
                <div className="text-xs text-muted-foreground truncate">{session.preview}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSession(session.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive smooth-transition"
                title="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary/50 smooth-transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
