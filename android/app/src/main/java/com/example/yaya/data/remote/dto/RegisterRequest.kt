package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class RegisterRequest(
    val businessName: String,
    val phoneNumber: String,
    val deviceId: String,
    val apiKey: String
)
