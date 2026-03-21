package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class AgentChatRequest(
    val message: String,
    val audioUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class AgentChatResponse(
    val id: String,
    val role: String,
    val content: String,
    val contentType: String = "text",
    val data: AgentDataPayload? = null,
    val timestamp: String
)

@JsonClass(generateAdapter = true)
data class AgentDataPayload(
    val type: String? = null,
    val title: String? = null,
    val value: String? = null,
    val trend: String? = null,
    val items: List<AgentDataItem>? = null
)

@JsonClass(generateAdapter = true)
data class AgentDataItem(
    val label: String,
    val value: Double,
    val extra: String? = null
)

@JsonClass(generateAdapter = true)
data class AgentHistoryResponse(
    val messages: List<AgentChatResponse>,
    val total: Int
)
