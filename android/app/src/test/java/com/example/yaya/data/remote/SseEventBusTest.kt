package com.example.yaya.data.remote

import com.squareup.moshi.Moshi
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SseEventBusTest {

    private lateinit var eventBus: SseEventBus

    @Before
    fun setup() {
        eventBus = SseEventBus(Moshi.Builder().build())
    }

    private suspend fun emitAndCollect(eventType: String, json: String): SseEvent {
        return kotlinx.coroutines.coroutineScope {
            val d = async { eventBus.events.first() }
            kotlinx.coroutines.yield() // let collector suspend before emitting
            eventBus.emit(eventType, json)
            d.await()
        }
    }

    @Test
    fun `parses connection-update event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("connection-update", """{"status":"connected"}""")
        assertTrue(event is SseEvent.ConnectionUpdate)
        assertEquals("connected", (event as SseEvent.ConnectionUpdate).status)
    }

    @Test
    fun `parses new-message event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("new-message",
            """{"jid":"123@s.whatsapp.net","direction":"incoming","preview":"Hola","timestamp":"2024-01-01","pushName":"Juan"}"""
        )
        assertTrue(event is SseEvent.NewMessage)
        val msg = event as SseEvent.NewMessage
        assertEquals("123@s.whatsapp.net", msg.jid)
        assertEquals("incoming", msg.direction)
        assertEquals("Hola", msg.preview)
        assertEquals("Juan", msg.pushName)
    }

    @Test
    fun `parses payment-matched event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("payment-matched",
            """{"paymentId":1,"orderId":2,"customerJid":"123@s.whatsapp.net"}"""
        )
        assertTrue(event is SseEvent.PaymentMatched)
        val pm = event as SseEvent.PaymentMatched
        assertEquals(1, pm.paymentId)
        assertEquals(2, pm.orderId)
        assertEquals("123@s.whatsapp.net", pm.customerJid)
    }

    @Test
    fun `parses health-alert event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("health-alert", """{"message":"High memory usage"}""")
        assertTrue(event is SseEvent.HealthAlert)
        assertEquals("High memory usage", (event as SseEvent.HealthAlert).message)
    }

    @Test
    fun `parses ai-uncertainty event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("ai-uncertainty",
            """{"jid":"123@s.whatsapp.net","reason":"ambiguous intent"}"""
        )
        assertTrue(event is SseEvent.AiUncertainty)
        val ai = event as SseEvent.AiUncertainty
        assertEquals("123@s.whatsapp.net", ai.jid)
        assertEquals("ambiguous intent", ai.reason)
    }

    @Test
    fun `parses connected event`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("connected", """{"tenantId":"tenant-123"}""")
        assertTrue(event is SseEvent.Connected)
        assertEquals("tenant-123", (event as SseEvent.Connected).tenantId)
    }

    @Test
    fun `unknown event type returns Unknown`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("some-future-event", """{"data":"test"}""")
        assertTrue(event is SseEvent.Unknown)
        assertEquals("some-future-event", (event as SseEvent.Unknown).event)
    }

    @Test
    fun `malformed JSON returns Unknown without crash`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("connection-update", "not valid json {{{")
        assertTrue(event is SseEvent.Unknown)
    }

    @Test
    fun `empty JSON object parses with defaults`() = runTest(UnconfinedTestDispatcher()) {
        val event = emitAndCollect("connection-update", "{}")
        assertTrue(event is SseEvent.ConnectionUpdate)
        assertEquals("", (event as SseEvent.ConnectionUpdate).status)
    }
}
