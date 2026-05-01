'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Mic,
  ListTodo,
  Settings,
  Menu,
  X,
  Brain,
  LogOut,
} from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Voz', href: '/voice', icon: Mic },
  { name: 'Tareas', href: '/tasks', icon: ListTodo },
  { name: 'Configurar', href: '/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 glass-card glow-hover"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 sidebar-premium transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 opacity-90"></div>
                <Brain className="w-6 h-6 text-white relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">agente.ceo</span>
                <span className="text-xs text-muted-foreground">Executive AI</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 smooth-transition glow-hover group',
                      isActive
                        ? 'glass-card border border-purple-500/30 text-white shadow-lg shadow-purple-500/20'
                        : 'text-muted-foreground hover:glass-card hover:text-white hover:border hover:border-white/10'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className={cn(
                      'w-5 h-5 mr-4 transition-colors',
                      isActive ? 'text-purple-400' : 'text-muted-foreground group-hover:text-cyan-400'
                    )} />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <button
              onClick={async () => {
                await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
                window.location.href = '/login'
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-muted-foreground hover:text-white rounded-xl hover:glass-card transition-all"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
