package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.UpdateSettingRequest
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getSettings(): Result<Map<String, String>> =
        safeApiCall { apiService.getSettings() }

    suspend fun updateSetting(key: String, value: String): Result<Unit> =
        safeApiCall { apiService.updateSetting(key, UpdateSettingRequest(value)) }
}
