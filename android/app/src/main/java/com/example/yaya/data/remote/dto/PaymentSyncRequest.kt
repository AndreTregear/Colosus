package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PaymentSyncRequest(
    val senderName: String,
    val amount: Double,
    val capturedAt: Long,
    val notificationHash: String
)
