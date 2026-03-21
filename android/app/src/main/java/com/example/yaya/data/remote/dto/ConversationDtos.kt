package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ConversationListResponse(
    val conversations: List<ConversationDto>,
    val total: Int
)

@JsonClass(generateAdapter = true)
data class ConversationDto(
    val jid: String,
    val customerName: String?,
    val lastMessage: String,
    val lastMessageDirection: String,
    val lastMessageAt: String,
    val unreadCount: Int,
    val aiPaused: Boolean
)

@JsonClass(generateAdapter = true)
data class ConversationMessagesResponse(
    val messages: List<MessageDto>,
    val total: Int,
    val customerName: String?,
    val aiPaused: Boolean
)

@JsonClass(generateAdapter = true)
data class MessageDto(
    val id: Int,
    val direction: String,
    val body: String,
    val timestamp: String,
    val pushName: String?
)

@JsonClass(generateAdapter = true)
data class PauseAiRequest(val paused: Boolean)

@JsonClass(generateAdapter = true)
data class PauseAiResponse(val ok: Boolean, val aiPaused: Boolean)

@JsonClass(generateAdapter = true)
data class SendMessageRequest(val message: String)

@JsonClass(generateAdapter = true)
data class SendMessageResponse(val ok: Boolean)
