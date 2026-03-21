package com.example.yaya.data.remote

import com.squareup.moshi.Moshi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed class SseEvent {
    data class ConnectionUpdate(val status: String) : SseEvent()
    data class NewMessage(
        val jid: String,
        val direction: String,
        val preview: String,
        val timestamp: String,
        val pushName: String?
    ) : SseEvent()
    data class PaymentMatched(
        val paymentId: Int,
        val orderId: Int,
        val customerJid: String
    ) : SseEvent()
    data class HealthAlert(val message: String) : SseEvent()
    data class AiUncertainty(val jid: String, val reason: String) : SseEvent()
    data class Connected(val tenantId: String) : SseEvent()
    data class Unknown(val event: String, val data: String) : SseEvent()
}

@Singleton
class SseEventBus @Inject constructor(
    private val moshi: Moshi
) {

    private val _events = MutableSharedFlow<SseEvent>(
        replay = 0,
        extraBufferCapacity = 64
    )
    val events: SharedFlow<SseEvent> = _events.asSharedFlow()

    private val mapAdapter = moshi.adapter(Map::class.java)

    fun emit(eventType: String, jsonData: String) {
        val event = parseEvent(eventType, jsonData)
        _events.tryEmit(event)
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseEvent(eventType: String, jsonData: String): SseEvent {
        return try {
            val map = mapAdapter.fromJson(jsonData) as? Map<String, Any?> ?: emptyMap()
            when (eventType) {
                "connection-update" -> SseEvent.ConnectionUpdate(
                    status = map["status"]?.toString() ?: ""
                )
                "new-message" -> SseEvent.NewMessage(
                    jid = map["jid"]?.toString() ?: "",
                    direction = map["direction"]?.toString() ?: "",
                    preview = map["preview"]?.toString() ?: "",
                    timestamp = map["timestamp"]?.toString() ?: "",
                    pushName = map["pushName"]?.toString()
                )
                "payment-matched" -> SseEvent.PaymentMatched(
                    paymentId = (map["paymentId"] as? Number)?.toInt() ?: 0,
                    orderId = (map["orderId"] as? Number)?.toInt() ?: 0,
                    customerJid = map["customerJid"]?.toString() ?: ""
                )
                "health-alert" -> SseEvent.HealthAlert(
                    message = map["message"]?.toString() ?: ""
                )
                "ai-uncertainty" -> SseEvent.AiUncertainty(
                    jid = map["jid"]?.toString() ?: "",
                    reason = map["reason"]?.toString() ?: ""
                )
                "connected" -> SseEvent.Connected(
                    tenantId = map["tenantId"]?.toString() ?: ""
                )
                else -> SseEvent.Unknown(eventType, jsonData)
            }
        } catch (_: Exception) {
            SseEvent.Unknown(eventType, jsonData)
        }
    }
}
