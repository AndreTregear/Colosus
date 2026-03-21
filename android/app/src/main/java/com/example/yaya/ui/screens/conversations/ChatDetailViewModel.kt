package com.example.yaya.ui.screens.conversations

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.MessageDto
import com.example.yaya.data.repository.ConversationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatDetailUiState(
    val messages: List<MessageDto> = emptyList(),
    val customerName: String? = null,
    val aiPaused: Boolean = false,
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val messageInput: String = "",
    val error: String? = null
)

@HiltViewModel
class ChatDetailViewModel @Inject constructor(
    private val repository: ConversationRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val jid: String = java.net.URLDecoder.decode(
        savedStateHandle.get<String>("jid") ?: "",
        "UTF-8"
    )

    private val _uiState = MutableStateFlow(ChatDetailUiState())
    val uiState: StateFlow<ChatDetailUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    init {
        loadMessages()
    }

    fun loadMessages() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getMessages(jid, limit = 100).fold(
                onSuccess = { response ->
                    _uiState.update {
                        it.copy(
                            messages = response.messages.reversed(),
                            customerName = response.customerName,
                            aiPaused = response.aiPaused,
                            isLoading = false
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isLoading = false, error = err.message) }
                }
            )
        }
    }

    fun updateMessageInput(text: String) {
        _uiState.update { it.copy(messageInput = text) }
    }

    fun sendMessage() {
        val text = _uiState.value.messageInput.trim()
        if (text.isBlank()) return

        val optimisticMsg = MessageDto(
            id = -1,
            direction = "outgoing",
            body = text,
            timestamp = java.time.Instant.now().toString(),
            pushName = null
        )

        _uiState.update {
            it.copy(
                messages = it.messages + optimisticMsg,
                messageInput = "",
                isSending = true
            )
        }

        viewModelScope.launch {
            repository.sendMessage(jid, text).fold(
                onSuccess = {
                    _uiState.update { it.copy(isSending = false) }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isSending = false, error = err.message) }
                }
            )
        }
    }

    fun toggleAiPause() {
        val currentlyPaused = _uiState.value.aiPaused
        viewModelScope.launch {
            repository.toggleAiPause(jid, !currentlyPaused).fold(
                onSuccess = { response ->
                    _uiState.update { it.copy(aiPaused = response.aiPaused) }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(error = err.message) }
                }
            )
        }
    }

    fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (true) {
                delay(5_000)
                repository.getMessages(jid, limit = 100).onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            messages = response.messages.reversed(),
                            aiPaused = response.aiPaused
                        )
                    }
                }
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }
}
