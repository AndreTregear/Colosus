package com.example.yaya.data.remote

import android.util.Log
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.security.TokenManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import okhttp3.*
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SseClient @Inject constructor(
    private val appConfigPreferences: AppConfigPreferences,
    private val tokenManager: TokenManager,
    private val sseEventBus: SseEventBus,
    private val networkMonitor: NetworkMonitor
) {
    private var call: Call? = null
    private var scope: CoroutineScope? = null
    private var retryCount = 0
    private val backoffRetries = 10
    private val baseRetryDelayMs = 2000L
    private val maxRetryDelayMs = 60_000L

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .build()

    fun connect() {
        disconnect()
        scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        scope?.launch { doConnect() }
        // Reconnect when network comes back
        scope?.launch {
            networkMonitor.isOnline.collect { online ->
                if (online && call == null) {
                    retryCount = 0
                    doConnect()
                }
            }
        }
    }

    private suspend fun doConnect() {
        try {
            val baseUrl = appConfigPreferences.backendUrl.first()
            val token = tokenManager.getToken()
            if (baseUrl.isBlank() || token.isNullOrBlank()) return

            val url = "${baseUrl.trimEnd('/')}/api/v1/mobile/events"
            val request = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $token")
                .header("Accept", "text/event-stream")
                .build()

            call = client.newCall(request)
            val response = call?.execute() ?: return

            if (!response.isSuccessful) {
                response.close()
                scheduleRetry()
                return
            }

            retryCount = 0
            val body = response.body ?: return
            val reader = BufferedReader(InputStreamReader(body.byteStream()))

            var eventType = ""
            val dataBuilder = StringBuilder()

            reader.forEachLine { line ->
                when {
                    line.startsWith("event:") -> {
                        eventType = line.removePrefix("event:").trim()
                    }
                    line.startsWith("data:") -> {
                        dataBuilder.append(line.removePrefix("data:").trim())
                    }
                    line.isBlank() && eventType.isNotBlank() -> {
                        val data = dataBuilder.toString()
                        sseEventBus.emit(eventType, data)
                        eventType = ""
                        dataBuilder.clear()
                    }
                }
            }

            response.close()
            call = null
            scheduleRetry()
        } catch (e: Exception) {
            if (e is CancellationException) throw e
            call = null
            Log.w(TAG, "SSE connection error (retry $retryCount)", e)
            scheduleRetry()
        }
    }

    private suspend fun scheduleRetry() {
        retryCount++
        val delay = if (retryCount <= backoffRetries) {
            baseRetryDelayMs * (1L shl minOf(retryCount - 1, 5))
        } else {
            maxRetryDelayMs
        }
        delay(delay)
        doConnect()
    }

    fun disconnect() {
        call?.cancel()
        call = null
        scope?.cancel()
        scope = null
        retryCount = 0
    }

    companion object {
        private const val TAG = "SseClient"
    }
}
