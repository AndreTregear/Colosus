'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        setTranscribing(true)
        try {
          const formData = new FormData()
          formData.append('file', blob, 'recording.webm')
          formData.append('model', 'large-v3')
          const res = await fetch('/api/whisper', { method: 'POST', body: formData })
          if (res.ok) {
            const data = await res.json()
            if (data.text) setInput(prev => prev ? prev + ' ' + data.text : data.text)
          }
        } finally {
          setTranscribing(false)
        }
      }

      recorder.start()
      setRecording(true)
    } catch {
      // Microphone not available
    }
  }

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-lg px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 glass-card p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none px-3 py-2 text-sm max-h-[200px]"
            style={{ fontSize: '16px' }}
          />

          <button
            onClick={toggleRecording}
            disabled={transcribing}
            className={`p-2.5 rounded-lg smooth-transition flex-shrink-0 ${
              recording
                ? 'bg-red-500 text-white animate-pulse'
                : transcribing
                  ? 'bg-secondary text-muted-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title={recording ? 'Detener' : 'Dictar'}
          >
            {transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> :
             recording ? <MicOff className="w-5 h-5" /> :
             <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed smooth-transition flex-shrink-0"
            title="Enviar"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
