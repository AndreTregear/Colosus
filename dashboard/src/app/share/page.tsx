'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Copy, Check, Share2, MessageCircle, Link2, ArrowLeft, Loader2 } from 'lucide-react'
import NextLink from 'next/link'

function ShareContent() {
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState<string | null>(null)

  // Contador referral code from URL params or session
  const ctdCode = searchParams.get('ctd') || ''
  const baseUrl = process.env.NEXT_PUBLIC_BUSINESS_URL || 'https://agente.ceo'
  const healthPhone = process.env.NEXT_PUBLIC_HEALTH_PHONE || '51999888777'

  const businessUrl = ctdCode
    ? `${baseUrl}/register?ref=${ctdCode}`
    : `${baseUrl}/register`
  const healthUrl = `https://wa.me/${healthPhone}?text=${encodeURIComponent('Hola, quiero evaluar la salud de mi hijo')}`

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const shareViaWhatsApp = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const qrUrl = (url: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=0a0a0a&color=ffffff`

  return (
    <>
      <NextLink
        href="/chat"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground smooth-transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </NextLink>

      <h1 className="text-2xl font-bold mb-2">Comparte Agente</h1>
      <p className="text-muted-foreground text-sm mb-8">
        {ctdCode
          ? `Tu codigo de referido: ${ctdCode}`
          : 'Invita a otros negocios a usar agente.ceo'}
      </p>

      {/* Business share card */}
      <div className="glass-card-strong p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Agente CEO</h2>
            <p className="text-muted-foreground text-xs">IA para tu negocio</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Ventas, inventario, pagos y atencion al cliente — todo automatizado con IA por WhatsApp.
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <img
            src={qrUrl(businessUrl)}
            alt="QR - Agente CEO"
            className="w-48 h-48 rounded-xl border border-white/10"
          />
        </div>

        <div className="text-xs text-center text-muted-foreground mb-4 break-all select-all">
          {businessUrl}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => copyLink(businessUrl, 'biz')}
            className="flex-1 btn-secondary px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {copied === 'biz' ? (
              <><Check className="w-4 h-4 text-green-400" /> Copiado</>
            ) : (
              <><Copy className="w-4 h-4" /> Copiar enlace</>
            )}
          </button>
          <button
            onClick={() => shareViaWhatsApp(
              ctdCode
                ? `Prueba el agente de IA para tu negocio. Registrate con mi enlace: ${businessUrl}`
                : `Prueba el agente de IA para tu negocio: ${businessUrl}`,
            )}
            className="flex-1 btn-gradient px-4 py-3 text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>

      {/* Health share card */}
      <div className="glass-card-strong p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Agente Fit / Salud</h2>
            <p className="text-muted-foreground text-xs">Nutricion infantil</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Evalua la nutricion infantil gratis por WhatsApp. Solo envia un mensaje para empezar.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => copyLink(healthUrl, 'health')}
            className="flex-1 btn-secondary px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {copied === 'health' ? (
              <><Check className="w-4 h-4 text-green-400" /> Copiado</>
            ) : (
              <><Copy className="w-4 h-4" /> Copiar enlace</>
            )}
          </button>
          <button
            onClick={() => shareViaWhatsApp(
              `Evalua gratis la nutricion de tu hijo por WhatsApp: ${healthUrl}`,
            )}
            className="flex-1 btn-gradient px-4 py-3 text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
    </>
  )
}

export default function SharePage() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-2xl mx-auto">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ShareContent />
      </Suspense>
    </div>
  )
}
