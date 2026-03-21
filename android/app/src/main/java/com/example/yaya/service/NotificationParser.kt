package com.example.yaya.service

import android.util.Log

data class ParsedPayment(
    val senderName: String,
    val amount: Double,
    val rawText: String
)

object NotificationParser {

    private const val TAG = "NotificationParser"

    // Amount pattern reused across all matchers: S/ or S/. followed by digits with optional commas/decimals
    private const val AMOUNT = """S/\.?\s*([0-9,]+\.?[0-9]*)"""

    // "Juan te envio S/ 25.50"
    private val PATTERN_TE_ENVIO = Regex(
        """(.+?)\s+te\s+envio\s+$AMOUNT""",
        RegexOption.IGNORE_CASE
    )

    // "Recibiste de Juan por S/ 25.50"
    private val PATTERN_RECIBISTE = Regex(
        """Recibiste\s+de\s+(.+?)\s+por\s+$AMOUNT""",
        RegexOption.IGNORE_CASE
    )

    // "Te han enviado S/ 25.50" (formal/plural)
    private val PATTERN_TE_HAN_ENVIADO = Regex(
        """(.+?)\s+te\s+ha[ns]?\s+enviado\s+$AMOUNT""",
        RegexOption.IGNORE_CASE
    )

    // "Has recibido S/ 25.50 de Juan"
    private val PATTERN_HAS_RECIBIDO = Regex(
        """Has\s+recibido\s+$AMOUNT\s+de\s+(.+)""",
        RegexOption.IGNORE_CASE
    )

    // "Juan te yapeo S/ 25.50" (colloquial)
    private val PATTERN_TE_YAPEO = Regex(
        """(.+?)\s+te\s+yapeo\s+$AMOUNT""",
        RegexOption.IGNORE_CASE
    )

    // Generic fallback: any text containing S/ + amount (name-less)
    private val PATTERN_GENERIC_AMOUNT = Regex(
        """$AMOUNT""",
        RegexOption.IGNORE_CASE
    )

    private val patterns = listOf(
        PATTERN_TE_ENVIO,
        PATTERN_RECIBISTE,
        PATTERN_TE_HAN_ENVIADO,
        PATTERN_TE_YAPEO
    )

    // HAS_RECIBIDO has swapped groups (amount first, name second)
    private val SWAPPED_PATTERNS = listOf(PATTERN_HAS_RECIBIDO)

    fun parse(text: String): ParsedPayment? {
        val trimmed = text.trim()

        for (pattern in patterns) {
            pattern.find(trimmed)?.let { match ->
                return extractPayment(match, trimmed)
            }
        }

        for (pattern in SWAPPED_PATTERNS) {
            pattern.find(trimmed)?.let { match ->
                return extractPaymentSwapped(match, trimmed)
            }
        }

        // Fallback: extract amount without sender name for monitoring
        if (PATTERN_GENERIC_AMOUNT.containsMatchIn(trimmed)) {
            Log.w(TAG, "Yape notification matched amount but no known pattern: $trimmed")
        }

        return null
    }

    private fun extractPayment(match: MatchResult, rawText: String): ParsedPayment? {
        val name = match.groupValues[1].trim()
        val amountStr = match.groupValues[2].replace(",", "")
        val amount = amountStr.toDoubleOrNull() ?: return null

        if (name.isBlank() || amount <= 0) return null

        return ParsedPayment(
            senderName = name,
            amount = amount,
            rawText = rawText
        )
    }

    private fun extractPaymentSwapped(match: MatchResult, rawText: String): ParsedPayment? {
        // Group 1 = amount, Group 2 = name
        val amountStr = match.groupValues[1].replace(",", "")
        val amount = amountStr.toDoubleOrNull() ?: return null
        val name = match.groupValues[2].trim()

        if (name.isBlank() || amount <= 0) return null

        return ParsedPayment(
            senderName = name,
            amount = amount,
            rawText = rawText
        )
    }
}
