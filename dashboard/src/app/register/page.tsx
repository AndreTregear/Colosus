'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    businessName: '',
    name: '',
    email: '',
    password: '',
  })

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000'}/api/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
          credentials: 'include',
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Registration failed (${res.status})`)
      }

      // Auto-login after registration
      const loginRes = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
        credentials: 'include',
      })

      if (loginRes.ok) {
        router.push('/chat')
      } else {
        router.push('/login')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 opacity-90"></div>
            <Brain className="w-8 h-8 text-white relative z-10" />
          </div>
        </div>

        <div className="glass-card-strong p-8 rounded-2xl">
          <h1 className="text-2xl font-bold text-center mb-2">Crear cuenta</h1>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Tu asistente de IA para WhatsApp en minutos
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre de tu negocio
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => set('businessName', e.target.value)}
                    placeholder="Pollería Doña Rosa"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tu nombre</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Rosa García"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.businessName || !form.name}
                  className="w-full btn-gradient py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="rosa@gmail.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 btn-secondary py-3 rounded-xl"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.email || !form.password}
                    className="flex-1 btn-gradient py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Crear cuenta'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300">
                Iniciar sesión
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
