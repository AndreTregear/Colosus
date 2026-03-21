package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class BatchSyncRequest(
    val payments: List<PaymentSyncRequest>
)
