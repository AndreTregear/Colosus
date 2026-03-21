package com.example.yaya.ui.screens.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.CalendarEventDto
import com.example.yaya.data.repository.CalendarRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CalendarUiState(
    val isConnected: Boolean = false,
    val email: String? = null,
    val events: List<CalendarEventDto> = emptyList(),
    val isLoading: Boolean = true,
    val isConnecting: Boolean = false,
    val isDisconnecting: Boolean = false,
    val error: String? = null,
    val showDisconnectDialog: Boolean = false
)

@HiltViewModel
class CalendarViewModel @Inject constructor(
    private val calendarRepository: CalendarRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalendarUiState())
    val uiState: StateFlow<CalendarUiState> = _uiState.asStateFlow()

    private val _authUrlEvent = MutableSharedFlow<String>()
    val authUrlEvent: SharedFlow<String> = _authUrlEvent.asSharedFlow()

    init {
        loadStatus()
    }

    fun loadStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            calendarRepository.getStatus().fold(
                onSuccess = { status ->
                    _uiState.update {
                        it.copy(
                            isConnected = status.connected,
                            email = status.email,
                            isLoading = false
                        )
                    }
                    if (status.connected) {
                        loadEvents()
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }

    fun connectCalendar() {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnecting = true, error = null) }
            calendarRepository.getAuthUrl().fold(
                onSuccess = { url ->
                    _uiState.update { it.copy(isConnecting = false) }
                    _authUrlEvent.emit(url)
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isConnecting = false, error = error.message)
                    }
                }
            )
        }
    }

    fun handleOAuthCallback(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isConnecting = true, error = null) }
            calendarRepository.handleCallback(code).fold(
                onSuccess = {
                    _uiState.update { it.copy(isConnecting = false) }
                    loadStatus()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isConnecting = false, error = error.message)
                    }
                }
            )
        }
    }

    fun showDisconnectDialog() {
        _uiState.update { it.copy(showDisconnectDialog = true) }
    }

    fun dismissDisconnectDialog() {
        _uiState.update { it.copy(showDisconnectDialog = false) }
    }

    fun disconnectCalendar() {
        viewModelScope.launch {
            _uiState.update { it.copy(isDisconnecting = true, showDisconnectDialog = false, error = null) }
            calendarRepository.disconnect().fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isConnected = false,
                            email = null,
                            events = emptyList(),
                            isDisconnecting = false
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isDisconnecting = false, error = error.message)
                    }
                }
            )
        }
    }

    private fun loadEvents() {
        viewModelScope.launch {
            calendarRepository.getEvents(days = 7).fold(
                onSuccess = { events ->
                    _uiState.update { it.copy(events = events) }
                },
                onFailure = { /* silently fail for events */ }
            )
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            calendarRepository.deleteEvent(eventId).fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(events = it.events.filter { e -> e.id != eventId })
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            )
        }
    }
}
