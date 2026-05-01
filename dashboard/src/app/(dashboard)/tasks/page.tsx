'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, CheckCircle, XCircle, Clock, Ban, ChevronDown,
  Play, Square, ArrowUp, ArrowDown, Plus, Zap, FileText,
  CreditCard, Users, BarChart3,
} from 'lucide-react'

interface Task {
  id: string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  template?: string
  progress?: string
  progressHistory: string[]
  result?: string
  error?: string
  elapsed: string
  startedAt: number
  completedAt?: number
  blockedBy?: string
}

interface Template {
  id: string
  name: string
  nameEs: string
  description: string
  priority: string
  estimatedTime: string
}

const priorityColors = {
  urgent: 'text-red-400 bg-red-400/10 border-red-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  normal: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  low: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
}

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  running: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  cancelled: <Ban className="w-4 h-4 text-gray-500" />,
}

const templateIcons: Record<string, React.ReactNode> = {
  'daily-summary': <BarChart3 className="w-5 h-5" />,
  'payment-followup': <CreditCard className="w-5 h-5" />,
  'market-research': <FileText className="w-5 h-5" />,
  'customer-analysis': <Users className="w-5 h-5" />,
  'weekly-report': <BarChart3 className="w-5 h-5" />,
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [customDesc, setCustomDesc] = useState('')

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    if (res.ok) {
      const data = await res.json()
      setTasks(data.tasks)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    // Fetch templates once
    fetch('/api/tasks?action=templates')
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {})

    // SSE for live updates
    const es = new EventSource('/api/voice/events')
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.type?.startsWith('task-')) {
          fetchTasks() // Refresh on any task event
        }
      } catch { /* ignore non-JSON */ }
    }

    // Poll as fallback
    const interval = setInterval(fetchTasks, 5000)

    return () => {
      es.close()
      clearInterval(interval)
    }
  }, [fetchTasks])

  async function createFromTemplate(template: Template) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        description: template.nameEs,
        template: template.id,
        priority: template.priority,
      }),
    })
    setShowTemplates(false)
    fetchTasks()
  }

  async function createCustom() {
    if (!customDesc.trim()) return
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', description: customDesc }),
    })
    setCustomDesc('')
    fetchTasks()
  }

  async function handleCancel(taskId: string) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', taskId }),
    })
    fetchTasks()
  }

  async function handleReprioritize(taskId: string, priority: string) {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reprioritize', taskId, priority }),
    })
    fetchTasks()
  }

  const running = tasks.filter((t) => t.status === 'running')
  const pending = tasks.filter((t) => t.status === 'pending')
  const done = tasks.filter((t) => ['completed', 'failed', 'cancelled'].includes(t.status))

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tareas</h1>
        <div className="flex gap-2 text-sm">
          {running.length > 0 && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Loader2 className="w-3 h-3 animate-spin" /> {running.length} en proceso
            </span>
          )}
          {pending.length > 0 && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
              <Clock className="w-3 h-3" /> {pending.length} en espera
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card-strong p-4 rounded-2xl mb-6">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createCustom()}
            placeholder="Describe una tarea para el agente..."
            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 text-sm text-white placeholder:text-muted-foreground"
          />
          <button
            onClick={createCustom}
            disabled={!customDesc.trim()}
            className="btn-gradient px-4 py-2 rounded-xl text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Asignar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> Plantillas rápidas
            <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showTemplates && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => createFromTemplate(t)}
                className="flex items-center gap-3 p-3 rounded-xl glass-card hover:border-purple-500/30 text-left transition-all"
              >
                <div className="text-purple-400">
                  {templateIcons[t.id] || <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.nameEs}</div>
                  <div className="text-xs text-muted-foreground">{t.estimatedTime}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No hay tareas</p>
            <p className="text-sm">Asigna una tarea al agente o usa una plantilla rápida</p>
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className={`glass-card p-4 rounded-xl transition-all ${
              task.status === 'running' ? 'border-cyan-500/30' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <div className="mt-0.5">{statusIcons[task.status]}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">{task.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Progress */}
                {task.progress && task.status === 'running' && (
                  <div className="text-xs text-cyan-400 mb-1">{task.progress}</div>
                )}

                {/* Elapsed time */}
                <div className="text-xs text-muted-foreground">
                  {task.elapsed}
                  {task.blockedBy && ` · esperando ${task.blockedBy}`}
                </div>

                {/* Expanded result */}
                {expandedTask === task.id && task.result && (
                  <div className="mt-3 p-3 rounded-lg bg-white/3 text-sm whitespace-pre-wrap">
                    {task.result}
                  </div>
                )}
                {expandedTask === task.id && task.error && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 text-sm text-red-400">
                    {task.error}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {(task.status === 'completed' || task.status === 'failed') && (
                  <button
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
                    title="Ver resultado"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {(task.status === 'running' || task.status === 'pending') && (
                  <>
                    {/* Priority up/down */}
                    <button
                      onClick={() => handleReprioritize(task.id, task.priority === 'urgent' ? 'high' : 'urgent')}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-orange-400"
                      title="Subir prioridad"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReprioritize(task.id, task.priority === 'low' ? 'normal' : 'low')}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-gray-400"
                      title="Bajar prioridad"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Cancel */}
                    <button
                      onClick={() => handleCancel(task.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                      title="Cancelar"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
