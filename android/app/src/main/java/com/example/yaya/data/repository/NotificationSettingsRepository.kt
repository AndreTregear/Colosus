package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.NotificationSettingsDto
import com.example.yaya.data.remote.dto.UpdateNotificationSettingsRequest
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationSettingsRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getSettings(): Result<NotificationSettingsDto> =
        safeApiCall { apiService.getNotificationSettings() }

    suspend fun updateSettings(
        enabled: Boolean,
        time: String,
        timezone: String
    ): Result<Unit> =
        safeApiCall { apiService.updateNotificationSettings(UpdateNotificationSettingsRequest(enabled, time, timezone)) }.map { }
}
