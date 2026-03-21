package com.example.yaya.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.yaya.domain.usecase.SyncPaymentsUseCase
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val syncPaymentsUseCase: SyncPaymentsUseCase
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "SyncWorker started, attempt: $runAttemptCount")

        if (runAttemptCount >= MAX_RETRIES) {
            Log.w(TAG, "Max retries reached, giving up")
            return Result.failure()
        }

        val result = syncPaymentsUseCase()

        return result.fold(
            onSuccess = { count ->
                Log.d(TAG, "Sync completed: $count payments synced")
                Result.success()
            },
            onFailure = { error ->
                Log.e(TAG, "Sync failed, will retry", error)
                Result.retry()
            }
        )
    }

    companion object {
        const val TAG = "SyncWorker"
        const val WORK_NAME_IMMEDIATE = "sync_immediate"
        const val WORK_NAME_PERIODIC = "sync_periodic"
        private const val MAX_RETRIES = 5
    }
}
