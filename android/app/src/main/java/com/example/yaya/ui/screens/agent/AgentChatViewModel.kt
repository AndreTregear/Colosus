package com.example.yaya.ui.screens.agent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.model.AgentMessageEntity
import com.example.yaya.data.repository.AgentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatMessage(
    val id: Long = 0,
    val role: String,
    val content: String,
    val contentType: String = "text",
    val dataJson: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class AgentChatUiState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val isRecording: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AgentChatViewModel @Inject constructor(
    private val agentRepository: AgentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AgentChatUiState())
    val uiState: StateFlow<AgentChatUiState> = _uiState.asStateFlow()

    init {
        loadLocalMessages()
        loadHistory()
    }

    private fun loadLocalMessages() {
        viewModelScope.launch {
            agentRepository.getLocalMessages().collect { entities ->
                _uiState.update { state ->
                    state.copy(
                        messages = entities.map { it.toChatMessage() }
                    )
                }
            }
        }
    }

    private fun loadHistory() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val result = agentRepository.getHistory()
            result.fold(
                onSuccess = { response ->
                    response.messages.forEach { msg ->
                        agentRepository.saveMessage(
                            AgentMessageEntity(
                                remoteId = msg.id,
                                role = msg.role,
                                content = msg.content,
                                contentType = msg.contentType,
                                dataJson = null
                            )
                        )
                    }
                    _uiState.update { it.copy(isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun sendMessage(text: String) {
        if (text.isBlank()) return

        viewModelScope.launch {
            // Save user message locally
            agentRepository.saveMessage(
                AgentMessageEntity(
                    role = "user",
                    content = text
                )
            )

            _uiState.update { it.copy(isSending = true, error = null) }

            val result = agentRepository.sendMessage(text)
            result.fold(
                onSuccess = { response ->
                    agentRepository.saveMessage(
                        AgentMessageEntity(
                            remoteId = response.id,
                            role = response.role,
                            content = response.content,
                            contentType = response.contentType,
                            dataJson = null
                        )
                    )
                    _uiState.update { it.copy(isSending = false) }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isSending = false,
                            error = error.message ?: "Error al enviar mensaje"
                        )
                    }
                }
            )
        }
    }

    fun toggleRecording() {
        _uiState.update { it.copy(isRecording = !it.isRecording) }
    }

    fun dismissError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun AgentMessageEntity.toChatMessage() = ChatMessage(
        id = id,
        role = role,
        content = content,
        contentType = contentType,
        dataJson = dataJson,
        timestamp = timestamp
    )
}
