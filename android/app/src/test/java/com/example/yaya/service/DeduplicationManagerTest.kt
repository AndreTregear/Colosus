package com.example.yaya.service

import com.example.yaya.data.local.db.PaymentDao
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class DeduplicationManagerTest {

    private lateinit var paymentDao: PaymentDao
    private lateinit var deduplicationManager: DeduplicationManager

    @Before
    fun setup() {
        paymentDao = mockk()
        deduplicationManager = DeduplicationManager(paymentDao)
    }

    @Test
    fun `computeHash returns consistent SHA-256 hex`() {
        val hash1 = deduplicationManager.computeHash("test text")
        val hash2 = deduplicationManager.computeHash("test text")
        assertEquals(hash1, hash2)
        assertEquals(64, hash1.length) // SHA-256 = 64 hex chars
    }

    @Test
    fun `computeHash differs for different inputs`() {
        val hash1 = deduplicationManager.computeHash("Juan te envio S/ 25.00")
        val hash2 = deduplicationManager.computeHash("Maria te envio S/ 30.00")
        assertTrue(hash1 != hash2)
    }

    @Test
    fun `isDuplicate returns true when hash exists in window`() = runTest {
        coEvery { paymentDao.countByHashSince(any(), any()) } returns 1
        assertTrue(deduplicationManager.isDuplicate("Juan te envio S/ 25.00"))
    }

    @Test
    fun `isDuplicate returns false when hash not found`() = runTest {
        coEvery { paymentDao.countByHashSince(any(), any()) } returns 0
        assertFalse(deduplicationManager.isDuplicate("Juan te envio S/ 25.00"))
    }

    @Test
    fun `isDuplicatePayment returns true when sender+amount match exists`() = runTest {
        coEvery { paymentDao.countBySenderAndAmountSince(any(), any(), any()) } returns 1
        assertTrue(deduplicationManager.isDuplicatePayment("Juan", 25.0))
    }

    @Test
    fun `isDuplicatePayment returns false when no match`() = runTest {
        coEvery { paymentDao.countBySenderAndAmountSince(any(), any(), any()) } returns 0
        assertFalse(deduplicationManager.isDuplicatePayment("Juan", 25.0))
    }
}
