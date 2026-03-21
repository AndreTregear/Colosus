package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.*
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ConversationRepository @Inject constructor(
    private val api: YayaApiService
) {
    suspend fun getConversations(limit: Int = 50, offset: Int = 0): Result<ConversationListResponse> =
        safeApiCall { api.getConversations(limit, offset) }

    suspend fun getMessages(jid: String, limit: Int = 50, offset: Int = 0): Result<ConversationMessagesResponse> =
        safeApiCall { api.getConversationMessages(jid, limit, offset) }

    suspend fun toggleAiPause(jid: String, paused: Boolean): Result<PauseAiResponse> =
        safeApiCall { api.pauseAi(jid, PauseAiRequest(paused)) }

    suspend fun sendMessage(jid: String, message: String): Result<SendMessageResponse> =
        safeApiCall { api.sendConversationMessage(jid, SendMessageRequest(message)) }
}
