package com.example.yaya.ui.screens.whatsapp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.repository.WhatsAppRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WhatsAppUiState(
    val connectionStatus: String = "disconnected",
    val phoneNumber: String? = null,
    val lastConnectedAt: String? = null,
    val reconnectAttempts: Int = 0,
    val errorMessage: String? = null,
    val workerRunning: Boolean = false,
    val qrAvailable: Boolean = false,
    val qrDataUrl: String? = null,
    val isLoading: Boolean = false,
    val isActionLoading: Boolean = false,
    val error: String? = null,
    val showDisconnectDialog: Boolean = false,
    val showResetDialog: Boolean = false
)

@HiltViewModel
class WhatsAppViewModel @Inject constructor(
    private val repository: WhatsAppRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WhatsAppUiState())
    val uiState: StateFlow<WhatsAppUiState> = _uiState.asStateFlow()

    private var statusPollingJob: Job? = null
    private var qrPollingJob: Job? = null

    init {
        loadStatus()
    }

    fun startPolling() {
        stopPolling()
        statusPollingJob = viewModelScope.launch {
            while (true) {
                delay(10_000)
                loadStatusSilent()
            }
        }
        qrPollingJob = viewModelScope.launch {
            while (true) {
                delay(5_000)
                if (_uiState.value.qrAvailable || _uiState.value.connectionStatus == "connecting") {
                    loadQr()
                }
            }
        }
    }

    fun stopPolling() {
        statusPollingJob?.cancel()
        qrPollingJob?.cancel()
        statusPollingJob = null
        qrPollingJob = null
    }

    fun loadStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getStatus().fold(
                onSuccess = { dto ->
                    _uiState.update {
                        it.copy(
                            connectionStatus = dto.connectionStatus,
                            phoneNumber = dto.phoneNumber,
                            lastConnectedAt = dto.lastConnectedAt,
                            reconnectAttempts = dto.reconnectAttempts,
                            errorMessage = dto.errorMessage,
                            workerRunning = dto.workerRunning,
                            qrAvailable = dto.qrAvailable,
                            isLoading = false
                        )
                    }
                    if (dto.qrAvailable) loadQr()
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isLoading = false, error = err.message) }
                }
            )
        }
    }

    private fun loadStatusSilent() {
        viewModelScope.launch {
            repository.getStatus().onSuccess { dto ->
                _uiState.update {
                    it.copy(
                        connectionStatus = dto.connectionStatus,
                        phoneNumber = dto.phoneNumber,
                        lastConnectedAt = dto.lastConnectedAt,
                        reconnectAttempts = dto.reconnectAttempts,
                        errorMessage = dto.errorMessage,
                        workerRunning = dto.workerRunning,
                        qrAvailable = dto.qrAvailable
                    )
                }
            }
        }
    }

    private fun loadQr() {
        viewModelScope.launch {
            repository.getQr().onSuccess { dto ->
                _uiState.update { it.copy(qrDataUrl = dto.qr) }
            }
        }
    }

    fun connect() {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, error = null) }
            repository.connect().fold(
                onSuccess = {
                    _uiState.update { it.copy(isActionLoading = false, connectionStatus = "connecting") }
                    delay(2000)
                    loadStatus()
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isActionLoading = false, error = err.message) }
                }
            )
        }
    }

    fun disconnect() {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, showDisconnectDialog = false, error = null) }
            repository.disconnect().fold(
                onSuccess = {
                    _uiState.update {
                        it.copy(
                            isActionLoading = false,
                            connectionStatus = "disconnected",
                            qrDataUrl = null
                        )
                    }
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isActionLoading = false, error = err.message) }
                }
            )
        }
    }

    fun reset() {
        viewModelScope.launch {
            _uiState.update { it.copy(isActionLoading = true, showResetDialog = false, error = null) }
            repository.reset().fold(
                onSuccess = {
                    _uiState.update { it.copy(isActionLoading = false, connectionStatus = "connecting") }
                    delay(3000)
                    loadStatus()
                },
                onFailure = { err ->
                    _uiState.update { it.copy(isActionLoading = false, error = err.message) }
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

    fun showResetDialog() {
        _uiState.update { it.copy(showResetDialog = true) }
    }

    fun dismissResetDialog() {
        _uiState.update { it.copy(showResetDialog = false) }
    }
}
