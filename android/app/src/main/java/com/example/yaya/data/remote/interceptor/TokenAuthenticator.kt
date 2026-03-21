package com.example.yaya.data.remote.interceptor

import android.util.Log
import com.example.yaya.data.remote.AuthEventBus
import com.example.yaya.data.remote.dto.RefreshTokenRequest
import com.example.yaya.data.remote.dto.RefreshTokenResponse
import com.example.yaya.security.TokenManager
import com.squareup.moshi.Moshi
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenAuthenticator @Inject constructor(
    private val tokenManager: TokenManager,
    private val authEventBus: AuthEventBus,
    private val moshi: Moshi,
    private val baseUrlInterceptor: BaseUrlInterceptor
) : Authenticator {

    private val refreshClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    @Synchronized
    override fun authenticate(route: Route?, response: Response): Request? {
        // Don't retry if we already retried with a fresh token
        if (response.request.header("X-Retry-With-Refresh") != null) {
            forceLogout()
            return null
        }

        val refreshToken = tokenManager.getRefreshToken()
        if (refreshToken.isNullOrBlank()) {
            forceLogout()
            return null
        }

        // Attempt to refresh the token
        val newToken = tryRefresh(refreshToken)
        if (newToken == null) {
            forceLogout()
            return null
        }

        // Retry the original request with the new token
        return response.request.newBuilder()
            .header("Authorization", "Bearer $newToken")
            .header("X-Retry-With-Refresh", "true")
            .build()
    }

    private fun tryRefresh(refreshToken: String): String? {
        return try {
            val requestBody = RefreshTokenRequest(refreshToken)
            val adapter = moshi.adapter(RefreshTokenRequest::class.java)
            val json = adapter.toJson(requestBody)

            val baseUrl = baseUrlInterceptor.cachedBaseUrl.ifBlank { return null }
            val url = "${baseUrl.trimEnd('/')}/api/v1/mobile/auth/refresh"

            val request = Request.Builder()
                .url(url)
                .post(json.toRequestBody("application/json".toMediaType()))
                .build()

            val response = refreshClient.newCall(request).execute()
            if (response.isSuccessful) {
                val responseAdapter = moshi.adapter(RefreshTokenResponse::class.java)
                val body = response.body?.string() ?: return null
                val refreshResponse = responseAdapter.fromJson(body) ?: return null

                tokenManager.saveToken(refreshResponse.token)
                refreshResponse.refreshToken?.let { tokenManager.saveRefreshToken(it) }

                refreshResponse.token
            } else {
                Log.w(TAG, "Token refresh failed: ${response.code}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Token refresh error", e)
            null
        }
    }

    private fun forceLogout() {
        tokenManager.clearToken()
        authEventBus.emitLogout()
    }

    companion object {
        private const val TAG = "TokenAuthenticator"
    }
}
