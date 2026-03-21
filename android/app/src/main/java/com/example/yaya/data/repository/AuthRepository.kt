package com.example.yaya.data.repository

import android.util.Log
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.local.datastore.SubscriptionPreferences
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.AuthResponse
import com.example.yaya.data.remote.dto.MobileLoginRequest
import com.example.yaya.data.remote.dto.MobileRegisterRequest
import com.example.yaya.security.TokenManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: YayaApiService,
    private val tokenManager: TokenManager,
    private val authPreferences: AuthPreferences,
    private val subscriptionPreferences: SubscriptionPreferences
) {
    suspend fun register(
        phone: String,
        countryCode: String,
        password: String,
        businessName: String,
        name: String?,
        email: String?
    ): Result<AuthResponse> {
        return try {
            val fullPhone = "$countryCode$phone"
            val request = MobileRegisterRequest(
                phone = fullPhone,
                password = password,
                businessName = businessName,
                name = name,
                email = email
            )
            val response = apiService.register(request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                saveAuthData(body)
                Log.d(TAG, "Registered successfully: ${body.tenant.id}")
                Result.success(body)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Registration failed"
                Log.e(TAG, "Registration failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Registration error", e)
            Result.failure(e)
        }
    }

    suspend fun login(
        phone: String,
        countryCode: String,
        password: String
    ): Result<AuthResponse> {
        return try {
            val fullPhone = "$countryCode$phone"
            val request = MobileLoginRequest(
                phone = fullPhone,
                password = password
            )
            val response = apiService.login(request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                saveAuthData(body)
                Log.d(TAG, "Login successful: ${body.tenant.id}")
                Result.success(body)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Login failed"
                Log.e(TAG, "Login failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Login error", e)
            Result.failure(e)
        }
    }

    private suspend fun saveAuthData(auth: AuthResponse) {
        tokenManager.saveToken(auth.token)
        auth.refreshToken?.let { tokenManager.saveRefreshToken(it) }
        authPreferences.setLoggedIn(true)
        authPreferences.setTenantId(auth.tenant.id)
        authPreferences.setTenantName(auth.tenant.name)
        authPreferences.setApiKey(auth.tenant.apiKey)
        authPreferences.setUserId(auth.user.id.toString())
        authPreferences.setUserName(auth.user.name ?: "")
        authPreferences.setPhoneNumber(auth.user.phone)
        // Save subscription status if available
        auth.subscription?.let { sub ->
            subscriptionPreferences.setPlanSlug(sub.planSlug)
            subscriptionPreferences.setPlanName(sub.planName)
            subscriptionPreferences.setCanSendMessages(sub.canSendMessages)
            subscriptionPreferences.setMessagesUsed(sub.messagesUsed)
            subscriptionPreferences.setMessagesLimit(sub.messagesLimit)
            subscriptionPreferences.setPaidPlan(sub.isPaid)
        }
    }

    suspend fun logout() {
        tokenManager.clearToken()
        authPreferences.clearAll()
    }

    fun isLoggedIn(): Boolean {
        return tokenManager.getToken() != null && !tokenManager.isTokenExpired()
    }

    suspend fun testConnection(): Result<Unit> {
        return try {
            val response = apiService.healthCheck()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Health check failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    companion object {
        private const val TAG = "AuthRepository"
    }
}
