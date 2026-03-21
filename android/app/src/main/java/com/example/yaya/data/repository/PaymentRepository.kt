package com.example.yaya.data.repository

import android.util.Log
import com.example.yaya.data.local.db.PaymentDao
import com.example.yaya.data.model.Payment
import com.example.yaya.data.model.PaymentStatus
import com.example.yaya.data.model.SyncStatus
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.BatchSyncRequest
import com.example.yaya.data.remote.dto.PaymentSyncRequest
import kotlinx.coroutines.flow.Flow
import java.util.Calendar
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentDao: PaymentDao,
    private val apiService: YayaApiService
) {
    fun getAllPayments(): Flow<List<Payment>> = paymentDao.getAllPayments()

    fun getByStatus(status: PaymentStatus): Flow<List<Payment>> = paymentDao.getByStatus(status)

    fun getTodayPayments(): Flow<List<Payment>> = paymentDao.getTodayPayments(startOfToday())

    fun getTodayTotal(): Flow<Double> = paymentDao.getTodayTotal(startOfToday())

    fun getTodayCount(): Flow<Int> = paymentDao.getTodayCount(startOfToday())

    suspend fun insertPayment(payment: Payment): Long {
        return paymentDao.insert(payment)
    }

    suspend fun syncUnsyncedPayments(): Result<Int> {
        return try {
            val unsynced = paymentDao.getUnsynced()
            if (unsynced.isEmpty()) return Result.success(0)

            var syncedCount = 0

            if (unsynced.size == 1) {
                val payment = unsynced.first()
                paymentDao.update(payment.copy(syncStatus = SyncStatus.SYNCING))

                val request = PaymentSyncRequest(
                    senderName = payment.senderName,
                    amount = payment.amount,
                    capturedAt = payment.capturedAt,
                    notificationHash = payment.notificationHash
                )

                val response = apiService.syncPayment(request)
                if (response.isSuccessful && response.body() != null) {
                    paymentDao.markSynced(
                        id = payment.id,
                        backendId = response.body()!!.id
                    )
                    syncedCount = 1
                } else {
                    paymentDao.update(
                        payment.copy(
                            syncStatus = SyncStatus.FAILED,
                            retryCount = payment.retryCount + 1
                        )
                    )
                }
            } else {
                unsynced.forEach { payment ->
                    paymentDao.update(payment.copy(syncStatus = SyncStatus.SYNCING))
                }

                val request = BatchSyncRequest(
                    payments = unsynced.map { payment ->
                        PaymentSyncRequest(
                            senderName = payment.senderName,
                            amount = payment.amount,
                            capturedAt = payment.capturedAt,
                            notificationHash = payment.notificationHash
                        )
                    }
                )

                val response = apiService.syncPaymentsBatch(request)
                if (response.isSuccessful && response.body() != null) {
                    val results = response.body()!!.results
                    unsynced.forEachIndexed { index, payment ->
                        if (index < results.size) {
                            paymentDao.markSynced(
                                id = payment.id,
                                backendId = results[index].id
                            )
                            syncedCount++
                        }
                    }
                } else {
                    unsynced.forEach { payment ->
                        paymentDao.update(
                            payment.copy(
                                syncStatus = SyncStatus.FAILED,
                                retryCount = payment.retryCount + 1
                            )
                        )
                    }
                }
            }

            Log.d(TAG, "Synced $syncedCount/${unsynced.size} payments")
            Result.success(syncedCount)
        } catch (e: Exception) {
            Log.e(TAG, "Sync failed", e)
            Result.failure(e)
        }
    }

    private fun startOfToday(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    companion object {
        private const val TAG = "PaymentRepository"
    }
}
