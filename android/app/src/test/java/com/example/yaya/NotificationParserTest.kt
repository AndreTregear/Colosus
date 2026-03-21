package com.example.yaya

import com.example.yaya.service.NotificationParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class NotificationParserTest {

    @Test
    fun `parse te envio format with integer amount`() {
        val result = NotificationParser.parse("Juan te envio S/ 25")
        assertNotNull(result)
        assertEquals("Juan", result!!.senderName)
        assertEquals(25.0, result.amount, 0.01)
    }

    @Test
    fun `parse te envio format with decimal amount`() {
        val result = NotificationParser.parse("Maria Lopez te envio S/ 150.50")
        assertNotNull(result)
        assertEquals("Maria Lopez", result!!.senderName)
        assertEquals(150.50, result.amount, 0.01)
    }

    @Test
    fun `parse te envio format with comma in amount`() {
        val result = NotificationParser.parse("Carlos te envio S/ 1,500.00")
        assertNotNull(result)
        assertEquals("Carlos", result!!.senderName)
        assertEquals(1500.0, result.amount, 0.01)
    }

    @Test
    fun `parse te envio format without space after S slash`() {
        val result = NotificationParser.parse("Ana te envio S/50")
        assertNotNull(result)
        assertEquals("Ana", result!!.senderName)
        assertEquals(50.0, result.amount, 0.01)
    }

    @Test
    fun `parse Recibiste de format with decimal amount`() {
        val result = NotificationParser.parse("Recibiste de Pedro Garcia por S/ 75.00")
        assertNotNull(result)
        assertEquals("Pedro Garcia", result!!.senderName)
        assertEquals(75.0, result.amount, 0.01)
    }

    @Test
    fun `parse Recibiste de format with integer amount`() {
        val result = NotificationParser.parse("Recibiste de Luis por S/ 200")
        assertNotNull(result)
        assertEquals("Luis", result!!.senderName)
        assertEquals(200.0, result.amount, 0.01)
    }

    @Test
    fun `parse Recibiste de format case insensitive`() {
        val result = NotificationParser.parse("recibiste de Rosa por S/ 30")
        assertNotNull(result)
        assertEquals("Rosa", result!!.senderName)
        assertEquals(30.0, result.amount, 0.01)
    }

    @Test
    fun `parse returns null for unrelated notification`() {
        val result = NotificationParser.parse("Tu saldo es S/ 500.00")
        assertNull(result)
    }

    @Test
    fun `parse returns null for empty string`() {
        val result = NotificationParser.parse("")
        assertNull(result)
    }

    @Test
    fun `parse returns null for missing amount`() {
        val result = NotificationParser.parse("Juan te envio S/")
        assertNull(result)
    }

    @Test
    fun `parse trims whitespace`() {
        val result = NotificationParser.parse("  Juan te envio S/ 100  ")
        assertNotNull(result)
        assertEquals("Juan", result!!.senderName)
        assertEquals(100.0, result.amount, 0.01)
    }

    @Test
    fun `parse te envio with multiple spaces`() {
        val result = NotificationParser.parse("Juan  te  envio  S/  30")
        assertNotNull(result)
        assertEquals("Juan", result!!.senderName)
        assertEquals(30.0, result.amount, 0.01)
    }

    @Test
    fun `parse preserves raw text`() {
        val raw = "Maria te envio S/ 45.50"
        val result = NotificationParser.parse(raw)
        assertNotNull(result)
        assertEquals(raw, result!!.rawText)
    }

    // --- New pattern tests ---

    @Test
    fun `parse te han enviado format`() {
        val result = NotificationParser.parse("Pedro te han enviado S/ 80.00")
        assertNotNull(result)
        assertEquals("Pedro", result!!.senderName)
        assertEquals(80.0, result.amount, 0.01)
    }

    @Test
    fun `parse te ha enviado format`() {
        val result = NotificationParser.parse("Ana te ha enviado S/ 120")
        assertNotNull(result)
        assertEquals("Ana", result!!.senderName)
        assertEquals(120.0, result.amount, 0.01)
    }

    @Test
    fun `parse has recibido format`() {
        val result = NotificationParser.parse("Has recibido S/ 50.00 de Carlos Perez")
        assertNotNull(result)
        assertEquals("Carlos Perez", result!!.senderName)
        assertEquals(50.0, result.amount, 0.01)
    }

    @Test
    fun `parse te yapeo format`() {
        val result = NotificationParser.parse("Luis te yapeo S/ 35")
        assertNotNull(result)
        assertEquals("Luis", result!!.senderName)
        assertEquals(35.0, result.amount, 0.01)
    }

    @Test
    fun `parse handles S slash dot format`() {
        val result = NotificationParser.parse("Juan te envio S/.25.50")
        assertNotNull(result)
        assertEquals("Juan", result!!.senderName)
        assertEquals(25.50, result.amount, 0.01)
    }

    @Test
    fun `parse returns null for balance notification`() {
        // "Tu saldo es S/ 500" should NOT match any named pattern
        val result = NotificationParser.parse("Tu saldo es S/ 500.00")
        assertNull(result)
    }
}
