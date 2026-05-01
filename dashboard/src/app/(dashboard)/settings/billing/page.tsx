'use client'

/**
 * Billing page — /settings/billing
 *
 * The only surface that kicks off a real payment. Flow:
 *   1. Load current subscription on mount. If active, show summary + boleta.
 *   2. User picks a plan → POST /api/billing/start → receive intent_id + qr_data.
 *   3. Show QR + countdown. Poll /api/billing/status every 2s.
 *   4. On confirmed, flip to success state with boleta link and "Ir al chat" CTA.
 *
 * We don't embed a QR library — we render the QR via quickchart.io, which
 * encodes arbitrary strings as a QR image. Swap for a bundled library if
 * external fetches become a concern.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, QrCode } from 'lucide-react'

type PlanId = 'monthly' | 'annual'

interface Plan {
  id: PlanId
  label: string
  priceSoles: string
  periodLabel: string
  description: string
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    label: 'Mensual',
    priceSoles: '49.00',
    periodLabel: '30 días',
    description: 'Acceso completo a Agente CEO por un mes',
  },
  {
    id: 'annual',
    label: 'Anual',
    priceSoles: '490.00',
    periodLabel: '365 días',
    description: 'Ahorra dos meses — pago único anual',
  },
]

type SubscriptionView =
  | {
      status: 'active'
      currentPeriodEnd: string | null
      boleta: {
        serie: string | null
        numero: number | null
        pdf_url: string | null
        aceptada: boolean | null
      } | null
    }
  | { status: 'inactive' }

interface PendingIntent {
  intent_id: string
  amount_soles: string
  qr_data: string | null
  payment_link: string | null
  expires_at: string
  plan: { id: string; label: string; description: string }
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sub, setSub] = useState<SubscriptionView | null>(null)
  const [pending, setPending] = useState<PendingIntent | null>(null)
  const [submittingPlan, setSubmittingPlan] = useState<PlanId | null>(null)
  const [polling, setPolling] = useState(false)
  const [paidAt, setPaidAt] = useState<string | null>(null)

  const loadCurrent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Reuse /api/billing/status with a sentinel intent id to pull
      // the current subscription row. Simplest would be a dedicated
      // GET endpoint — for v0 we just read through getSubscription on
      // the status route. Instead: do a cheap fetch to /api/billing/status
      // without intent_id and expect 400, then fall back to inactive.
      // For v1 we'll ship /api/billing/me.
      const res = await fetch('/api/billing/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) {
        setSub({ status: 'inactive' })
        return
      }
      const data = await res.json()
      if (data?.status === 'active') {
        setSub({
          status: 'active',
          currentPeriodEnd: data.current_period_end,
          boleta: data.boleta,
        })
      } else {
        setSub({ status: 'inactive' })
      }
    } catch {
      setSub({ status: 'inactive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrent()
  }, [loadCurrent])

  // Poll status while a pending intent exists.
  useEffect(() => {
    if (!pending) return
    let cancelled = false
    setPolling(true)

    const check = async () => {
      try {
        const res = await fetch(
          `/api/billing/status?intent_id=${encodeURIComponent(pending.intent_id)}`,
          { credentials: 'include', cache: 'no-store' },
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data.status === 'active') {
          setPaidAt(new Date().toISOString())
          setPending(null)
          setPolling(false)
          await loadCurrent()
        } else if (data.status === 'expired' || data.status === 'canceled') {
          setPending(null)
          setPolling(false)
          setError('El pago expiró. Intenta de nuevo.')
        }
      } catch {
        /* network blip — keep polling */
      }
    }

    const interval = setInterval(check, 2000)
    check()
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pending, loadCurrent])

  async function startPayment(planId: PlanId) {
    setSubmittingPlan(planId)
    setError(null)
    try {
      const res = await fetch('/api/billing/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'No se pudo iniciar el pago')
      }
      setPending(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmittingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (paidAt || sub?.status === 'active') {
    return (
      <ActiveState
        currentPeriodEnd={
          sub?.status === 'active' ? sub.currentPeriodEnd : null
        }
        boleta={sub?.status === 'active' ? sub.boleta : null}
        justPaid={paidAt !== null}
      />
    )
  }

  if (pending) {
    return <PendingState pending={pending} polling={polling} onAbort={() => setPending(null)} />
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-2">Activa tu suscripción</h1>
      <p className="text-neutral-400 mb-8">
        Agente CEO funciona con una suscripción mensual o anual. Pagas con Yape
        directo desde tu celular — recibes boleta electrónica SUNAT al instante.
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            disabled={submittingPlan !== null}
            onClick={() => startPayment(plan.id)}
            className="relative rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-left transition hover:border-yellow-500/60 hover:bg-neutral-900/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
              Plan {plan.label}
            </div>
            <div className="mb-1 text-3xl font-semibold text-white">
              S/ {plan.priceSoles}
            </div>
            <div className="mb-4 text-sm text-neutral-400">{plan.periodLabel}</div>
            <div className="mb-6 text-sm text-neutral-300">{plan.description}</div>
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
              {submittingPlan === plan.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Pagar con Yape <ArrowRight className="w-4 h-4" />
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-neutral-500">
        Recibirás una boleta electrónica SUNAT al completar el pago.
      </p>
    </div>
  )
}

function PendingState({
  pending,
  polling,
  onAbort,
}: {
  pending: PendingIntent
  polling: boolean
  onAbort: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(pending.expires_at).getTime() - Date.now()) / 1000)),
  )

  useEffect(() => {
    const i = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(i)
  }, [])

  const qrSrc = pending.qr_data
    ? `https://quickchart.io/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(pending.qr_data)}`
    : null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="max-w-xl mx-auto px-6 py-12 text-center">
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-neutral-400">
        <QrCode className="w-4 h-4" />
        <span>{pending.plan.description}</span>
      </div>
      <h1 className="mb-2 text-3xl font-semibold">S/ {pending.amount_soles}</h1>
      <p className="mb-8 text-neutral-400">
        Escanea con Yape o pulsa el botón desde tu celular.
      </p>

      {qrSrc ? (
        <div className="mb-6 inline-flex rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="Yape QR" width={260} height={260} />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
          QR no disponible — usa el botón de abajo.
        </div>
      )}

      {pending.payment_link && (
        <a
          href={pending.payment_link}
          className="mb-6 inline-block rounded-lg bg-yellow-500 px-6 py-3 font-medium text-black transition hover:bg-yellow-400"
        >
          Abrir en Yape
        </a>
      )}

      <div className="mt-2 flex items-center justify-center gap-3 text-sm text-neutral-400">
        {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        <span>
          {secondsLeft > 0
            ? `Esperando pago · expira en ${mm}:${ss}`
            : 'Esta orden expiró. Puedes iniciar otra.'}
        </span>
      </div>

      <button
        onClick={onAbort}
        className="mt-6 text-sm text-neutral-500 underline hover:text-neutral-300"
      >
        Cancelar y elegir otro plan
      </button>
    </div>
  )
}

function ActiveState({
  currentPeriodEnd,
  boleta,
  justPaid,
}: {
  currentPeriodEnd: string | null
  boleta:
    | { serie: string | null; numero: number | null; pdf_url: string | null; aceptada: boolean | null }
    | null
  justPaid: boolean
}) {
  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-6 flex items-center gap-3 text-green-400">
        <CheckCircle2 className="w-8 h-8" />
        <h1 className="text-3xl font-semibold">
          {justPaid ? '¡Pago recibido!' : 'Suscripción activa'}
        </h1>
      </div>

      {currentPeriodEnd && (
        <p className="mb-4 text-neutral-300">
          Tu plan renueva el{' '}
          <strong className="text-white">
            {new Date(currentPeriodEnd).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          .
        </p>
      )}

      {boleta && boleta.pdf_url && (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
            Boleta SUNAT
          </div>
          <div className="mb-3 text-sm text-neutral-300">
            {boleta.serie}-{boleta.numero}
            {boleta.aceptada === true && (
              <span className="ml-2 text-green-400">✓ Aceptada por SUNAT</span>
            )}
            {boleta.aceptada === false && (
              <span className="ml-2 text-yellow-400">En proceso</span>
            )}
          </div>
          <a
            href={boleta.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
          >
            Descargar PDF →
          </a>
        </div>
      )}

      <Link
        href="/chat"
        className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-medium text-black transition hover:bg-yellow-400"
      >
        Ir al chat <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
