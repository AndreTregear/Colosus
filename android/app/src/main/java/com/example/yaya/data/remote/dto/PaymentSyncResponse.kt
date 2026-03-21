package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PaymentSyncResponse(
    val id: String,
    val status: String
)
