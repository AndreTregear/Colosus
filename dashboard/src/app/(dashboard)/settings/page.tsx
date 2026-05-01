'use client'

import { useState, useEffect } from 'react'
import { Smartphone, RefreshCw, CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react'

interface TenantStatus {
  connected: boolean
  phone?: string
  qr?: string
}

export default function SettingsPage() {
  const [status, setStatus] = useState<TenantStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 5000) // Poll every 5s for QR updates
    return () => clearInterval(interval)
  }, [])

  async function checkStatus() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/whatsapp/status`,
        { credentials: 'include' },
      )
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      // API not available
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Configuración</h1>

      {/* WhatsApp Connection */}
      <div className="glass-card-strong p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-green-400" />
          <h2 className="text-lg font-semibold">WhatsApp</h2>
          {status?.connected ? (
            <span className="flex items-center gap-1 text-green-400 text-sm ml-auto">
              <CheckCircle className="w-4 h-4" /> Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-400 text-sm ml-auto">
              <XCircle className="w-4 h-4" /> Desconectado
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-green-400" />
              <span>Número: {status.phone || 'Conectado'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu WhatsApp está conectado. Los mensajes de clientes se procesan
              automáticamente con IA.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escanea el código QR con tu WhatsApp para conectar tu número de negocio.
            </p>
            {status?.qr ? (
              <div className="flex justify-center">
                <img
                  src={status.qr}
                  alt="QR Code"
                  className="w-64 h-64 rounded-xl border border-white/10"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-muted-foreground">
                  No hay código QR disponible. Contacta soporte para activar tu WhatsApp.
                </p>
                <button
                  onClick={checkStatus}
                  className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
              </div>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>1. Abre WhatsApp en tu teléfono</p>
              <p>2. Ve a Configuración → Dispositivos vinculados</p>
              <p>3. Toca &quot;Vincular un dispositivo&quot;</p>
              <p>4. Escanea el código QR de arriba</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="glass-card-strong p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Información del negocio</h2>
        <p className="text-sm text-muted-foreground">
          Tu asistente de IA aprende sobre tu negocio a través de las conversaciones.
          Háblale por chat o por voz para configurar tus productos, servicios y tono de comunicación.
        </p>
      </div>
    </div>
  )
}
