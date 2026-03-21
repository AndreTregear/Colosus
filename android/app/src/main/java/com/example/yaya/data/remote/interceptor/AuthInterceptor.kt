package com.example.yaya.data.remote.interceptor

import com.example.yaya.security.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val path = original.url.encodedPath

        // Skip auth header for public endpoints
        val isPublic = path.endsWith("/api/v1/mobile/auth/login") ||
                path.endsWith("/api/v1/mobile/auth/register") ||
                path.endsWith("/api/v1/mobile/auth/refresh") ||
                path.endsWith("/api/v1/health")

        val request = if (!isPublic) {
            val token = tokenManager.getToken()
            if (token != null) {
                original.newBuilder()
                    .header("Authorization", "Bearer $token")
                    .build()
            } else {
                original
            }
        } else {
            original
        }

        return chain.proceed(request)
    }
}
