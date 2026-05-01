'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Loader2, Volume2 } from 'lucide-react'

interface Turn {
  role: 'user' | 'agent'
  text: string
  timings?: { sttMs: number; llmMs: number; ttsMs: number; totalMs: number }
}

export default function VoicePage() {
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'speaking'>('idle')
  const [turns, setTurns] = useState<Turn[]>([])
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        processAudio(blob)
      }

      recorder.start()
      setState('recording')
    } catch {
      setError('No se pudo acceder al micrófono. Permite el acceso en tu navegador.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setState('processing')
  }

  async function processAudio(blob: Blob) {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'voice.webm')
      formData.append('history', JSON.stringify(
        turns.slice(-6).map(t => ({ role: t.role === 'agent' ? 'assistant' : 'user', content: t.text }))
      ))

      const res = await fetch('/api/voice', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Error ${res.status}`)

      const data = await res.json()

      if (data.transcription) {
        setTurns(prev => [...prev, { role: 'user', text: data.transcription }])
      }
      if (data.response) {
        setTurns(prev => [...prev, { role: 'agent', text: data.response, timings: data.timings }])
      }

      if (data.audio) {
        setState('speaking')
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
        audioRef.current = audio
        audio.onended = () => setState('idle')
        audio.onerror = () => setState('idle')
        await audio.play()
      } else {
        setState('idle')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando audio')
      setState('idle')
    }
  }

  function stopSpeaking() {
    audioRef.current?.pause()
    setState('idle')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {turns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Mic className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Modo Voz</p>
            <p className="text-sm mt-1">Toca el botón para hablar con tu agente</p>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              turn.role === 'user'
                ? 'bg-primary/20 text-foreground'
                : 'glass-card text-foreground'
            }`}>
              <p>{turn.text}</p>
              {turn.timings && (
                <p className="text-xs text-muted-foreground mt-1">{turn.timings.totalMs}ms</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <div className="border-t border-border p-6 flex flex-col items-center gap-3">
        <button
          onClick={
            state === 'idle' ? startRecording :
            state === 'recording' ? stopRecording :
            state === 'speaking' ? stopSpeaking :
            undefined
          }
          disabled={state === 'processing'}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            state === 'recording'
              ? 'bg-red-500 text-white animate-pulse scale-110'
              : state === 'processing'
                ? 'bg-secondary text-muted-foreground'
                : state === 'speaking'
                  ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50 animate-pulse'
                  : 'bg-primary/20 text-primary hover:bg-primary/30 hover:scale-105'
          }`}
        >
          {state === 'recording' ? <Square className="w-8 h-8" /> :
           state === 'processing' ? <Loader2 className="w-8 h-8 animate-spin" /> :
           state === 'speaking' ? <Volume2 className="w-8 h-8" /> :
           <Mic className="w-8 h-8" />}
        </button>
        <p className="text-xs text-muted-foreground">
          {state === 'idle' ? 'Toca para hablar' :
           state === 'recording' ? 'Escuchando... toca para enviar' :
           state === 'processing' ? 'Procesando...' :
           'Respondiendo... toca para detener'}
        </p>
      </div>
    </div>
  )
}
