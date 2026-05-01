'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Cpu, Server } from 'lucide-react'
import { MODELS, type ModelConfig } from '@/lib/models'

interface ModelSelectorProps {
  selectedModelId: string
  onSelect: (modelId: string) => void
}

export function ModelSelector({ selectedModelId, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = MODELS.find((m) => m.id === selectedModelId) ?? MODELS[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary smooth-transition text-sm"
      >
        <ModelDot model={selected} />
        <span className="text-foreground font-medium">{selected.name}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground smooth-transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 glass-card shadow-xl shadow-black/20 border border-border/50 py-1 z-50">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 smooth-transition ${
                model.id === selectedModelId ? 'bg-secondary/30' : ''
              }`}
            >
              <ModelDot model={model} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{model.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {model.tag === 'local' ? (
                    <><Cpu className="w-3 h-3" /> Local</>
                  ) : (
                    <><Server className="w-3 h-3" /> HPC Cluster</>
                  )}
                </div>
              </div>
              {model.id === selectedModelId && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelDot({ model }: { model: ModelConfig }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        model.tag === 'local'
          ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
          : 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]'
      }`}
    />
  )
}
