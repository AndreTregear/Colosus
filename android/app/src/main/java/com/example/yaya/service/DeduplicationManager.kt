package com.example.yaya.service

import com.example.yaya.data.local.db.PaymentDao
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeduplicationManager @Inject constructor(
    private val paymentDao: PaymentDao
) {
    suspend fun isDuplicate(rawText: String): Boolean {
        val hash = computeHash(rawText)
        val since = System.currentTimeMillis() - DEDUP_WINDOW_MS
        return paymentDao.countByHashSince(hash, since) > 0
    }

    suspend fun isDuplicatePayment(senderName: String, amount: Double): Boolean {
        val since = System.currentTimeMillis() - SENDER_AMOUNT_WINDOW_MS
        return paymentDao.countBySenderAndAmountSince(senderName, amount, since) > 0
    }

    fun computeHash(rawText: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(rawText.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    companion object {
        private const val DEDUP_WINDOW_MS = 60_000L
        private const val SENDER_AMOUNT_WINDOW_MS = 120_000L
    }
}
