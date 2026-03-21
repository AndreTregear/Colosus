package com.example.yaya.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.example.yaya.MainActivity
import com.example.yaya.R
import com.example.yaya.data.remote.SseEvent
import com.example.yaya.data.remote.SseEventBus
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppNotificationManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val sseEventBus: SseEventBus
) {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    private var notificationId = 1000

    companion object {
        const val CHANNEL_MESSAGES = "yaya_messages"
        const val CHANNEL_ORDERS = "yaya_orders"
        const val CHANNEL_ALERTS = "yaya_alerts"
    }

    fun initialize() {
        createChannels()
        observeEvents()
    }

    private fun createChannels() {
        val channels = listOf(
            NotificationChannel(
                CHANNEL_MESSAGES, "Mensajes",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = "Mensajes de clientes por WhatsApp" },
            NotificationChannel(
                CHANNEL_ORDERS, "Pedidos y pagos",
                NotificationManager.IMPORTANCE_HIGH
            ).apply { description = "Nuevos pedidos y pagos confirmados" },
            NotificationChannel(
                CHANNEL_ALERTS, "Alertas",
                NotificationManager.IMPORTANCE_HIGH
            ).apply { description = "Alertas de conexion y problemas" }
        )
        channels.forEach { notificationManager.createNotificationChannel(it) }
    }

    private fun observeEvents() {
        scope.launch {
            sseEventBus.events.collect { event ->
                when (event) {
                    is SseEvent.NewMessage -> {
                        if (event.direction == "incoming") {
                            showNotification(
                                channel = CHANNEL_MESSAGES,
                                title = "Nuevo mensaje${event.pushName?.let { " de $it" } ?: ""}",
                                body = event.preview
                            )
                        }
                    }
                    is SseEvent.PaymentMatched -> {
                        showNotification(
                            channel = CHANNEL_ORDERS,
                            title = "Pago confirmado",
                            body = "Pedido #${event.orderId} — pago recibido"
                        )
                    }
                    is SseEvent.HealthAlert -> {
                        showNotification(
                            channel = CHANNEL_ALERTS,
                            title = "Alerta de conexion",
                            body = event.message
                        )
                    }
                    is SseEvent.AiUncertainty -> {
                        showNotification(
                            channel = CHANNEL_ALERTS,
                            title = "La IA necesita ayuda",
                            body = "No pudo procesar el mensaje de un cliente"
                        )
                    }
                    else -> { /* ignore */ }
                }
            }
        }
    }

    private fun showNotification(channel: String, title: String, body: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        notificationManager.notify(notificationId++, notification)
    }
}
