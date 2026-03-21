package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class WhatsAppStatusDto(
    val connectionStatus: String,
    val phoneNumber: String?,
    val lastConnectedAt: String?,
    val lastQrAt: String?,
    val reconnectAttempts: Int,
    val errorMessage: String?,
    val workerRunning: Boolean,
    val qrAvailable: Boolean
)

@JsonClass(generateAdapter = true)
data class WhatsAppQrDto(
    val status: String,
    val qr: String?
)

@JsonClass(generateAdapter = true)
data class WhatsAppActionResponse(
    val ok: Boolean,
    val alreadyRunning: Boolean? = null
)
