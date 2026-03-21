package com.example.yaya.domain.usecase

import android.util.Log
import com.example.yaya.data.repository.PaymentRepository
import javax.inject.Inject

class SyncPaymentsUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    suspend operator fun invoke(): Result<Int> {
        return paymentRepository.syncUnsyncedPayments().also { result ->
            result.onFailure { e ->
                Log.e(TAG, "Payment sync failed", e)
            }
        }
    }

    companion object {
        private const val TAG = "SyncPaymentsUseCase"
    }
}
