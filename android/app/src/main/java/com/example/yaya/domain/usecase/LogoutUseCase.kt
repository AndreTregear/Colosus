package com.example.yaya.domain.usecase

import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.remote.SseClient
import com.example.yaya.security.TokenManager
import com.example.yaya.worker.SyncScheduler
import javax.inject.Inject

class LogoutUseCase @Inject constructor(
    private val tokenManager: TokenManager,
    private val authPreferences: AuthPreferences,
    private val sseClient: SseClient,
    private val syncScheduler: SyncScheduler
) {
    suspend operator fun invoke() {
        sseClient.disconnect()
        syncScheduler.cancelAll()
        tokenManager.clearToken()
        authPreferences.clearAll()
    }
}
