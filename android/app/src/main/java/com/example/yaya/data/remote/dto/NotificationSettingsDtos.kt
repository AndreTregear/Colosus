package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class NotificationSettingsDto(
    val enabled: Boolean,
    val time: String,
    val timezone: String,
    val lastSent: String? = null
)

@JsonClass(generateAdapter = true)
data class UpdateNotificationSettingsRequest(
    val enabled: Boolean,
    val time: String,
    val timezone: String
)

@JsonClass(generateAdapter = true)
data class OkResponse(
    val ok: Boolean
)
