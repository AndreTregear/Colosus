package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class FollowUpFlowDto(
    val type: String,
    val trigger: String,
    val delayHours: Int,
    val templateKey: String,
    val enabled: Boolean
)

@JsonClass(generateAdapter = true)
data class ToggleFlowRequest(
    val enabled: Boolean
)
