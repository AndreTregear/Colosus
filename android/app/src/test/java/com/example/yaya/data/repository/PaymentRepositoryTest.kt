package com.example.yaya.data.repository

import com.example.yaya.data.local.db.PaymentDao
import com.example.yaya.data.model.Payment
import com.example.yaya.data.model.PaymentStatus
import com.example.yaya.data.model.SyncStatus
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.PaymentSyncResponse
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class PaymentRepositoryTest {

    private lateinit var paymentDao: PaymentDao
    private lateinit var apiService: YayaApiService
    private lateinit var repository: PaymentRepository

    @Before
    fun setup() {
        paymentDao = mockk(relaxed = true)
        apiService = mockk()
        repository = PaymentRepository(paymentDao, apiService)
    }

    private fun makePayment(id: Long = 1, senderName: String = "Juan", amount: Double = 25.0) = Payment(
        id = id,
        senderName = senderName,
        amount = amount,
        rawNotification = "$senderName te envio S/ $amount",
        notificationHash = "hash_$id",
        paymentStatus = PaymentStatus.PENDING,
        syncStatus = SyncStatus.UNSYNCED
    )

    @Test
    fun `syncUnsyncedPayments returns 0 when no unsynced payments`() = runTest {
        coEvery { paymentDao.getUnsynced() } returns emptyList()
        val result = repository.syncUnsyncedPayments()
        assertTrue(result.isSuccess)
        assertEquals(0, result.getOrNull())
    }

    @Test
    fun `syncUnsyncedPayments syncs single payment`() = runTest {
        val payment = makePayment()
        coEvery { paymentDao.getUnsynced() } returns listOf(payment)
        coEvery { paymentDao.update(any()) } returns Unit
        coEvery { apiService.syncPayment(any()) } returns Response.success(
            PaymentSyncResponse(id = "backend-1", status = "matched")
        )

        val result = repository.syncUnsyncedPayments()
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull())
        coVerify { paymentDao.markSynced(id = eq(1), syncStatus = any(), syncedAt = any(), backendId = eq("backend-1")) }
    }

    @Test
    fun `syncUnsyncedPayments marks payment as FAILED on API error`() = runTest {
        val payment = makePayment()
        coEvery { paymentDao.getUnsynced() } returns listOf(payment)
        coEvery { paymentDao.update(any()) } returns Unit
        coEvery { apiService.syncPayment(any()) } returns Response.error(
            500, okhttp3.ResponseBody.create(null, "Server Error")
        )

        val result = repository.syncUnsyncedPayments()
        assertTrue(result.isSuccess)
        assertEquals(0, result.getOrNull())
        coVerify {
            paymentDao.update(match {
                it.syncStatus == SyncStatus.FAILED && it.retryCount == 1
            })
        }
    }

    @Test
    fun `syncUnsyncedPayments returns failure on exception`() = runTest {
        coEvery { paymentDao.getUnsynced() } throws RuntimeException("DB error")
        val result = repository.syncUnsyncedPayments()
        assertTrue(result.isFailure)
    }
}
