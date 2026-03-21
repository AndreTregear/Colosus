package com.example.yaya.data.repository

import com.example.yaya.data.local.db.AgentMessageDao
import com.example.yaya.data.model.AgentMessageEntity
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.AgentChatRequest
import com.example.yaya.data.remote.dto.AgentChatResponse
import com.example.yaya.data.remote.dto.AgentHistoryResponse
import com.example.yaya.data.remote.safeApiCall
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AgentRepository @Inject constructor(
    private val apiService: YayaApiService,
    private val agentMessageDao: AgentMessageDao
) {
    suspend fun sendMessage(message: String): Result<AgentChatResponse> =
        safeApiCall { apiService.sendAgentMessage(AgentChatRequest(message = message)) }

    suspend fun getHistory(limit: Int = 50, offset: Int = 0): Result<AgentHistoryResponse> =
        safeApiCall { apiService.getAgentHistory(limit, offset) }

    fun getLocalMessages(): Flow<List<AgentMessageEntity>> =
        agentMessageDao.getAllMessages()

    suspend fun saveMessage(message: AgentMessageEntity): Long =
        agentMessageDao.insert(message)

    suspend fun clearLocalHistory() =
        agentMessageDao.deleteAll()
}
