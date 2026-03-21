package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.WhatsAppActionResponse
import com.example.yaya.data.remote.dto.WhatsAppQrDto
import com.example.yaya.data.remote.dto.WhatsAppStatusDto
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WhatsAppRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getStatus(): Result<WhatsAppStatusDto> =
        safeApiCall { apiService.getWhatsAppStatus() }

    suspend fun getQr(): Result<WhatsAppQrDto> =
        safeApiCall { apiService.getWhatsAppQr() }

    suspend fun connect(): Result<WhatsAppActionResponse> =
        safeApiCall { apiService.connectWhatsApp() }

    suspend fun disconnect(): Result<WhatsAppActionResponse> =
        safeApiCall { apiService.disconnectWhatsApp() }

    suspend fun reset(): Result<WhatsAppActionResponse> =
        safeApiCall { apiService.resetWhatsApp() }
}
