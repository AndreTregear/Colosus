package com.example.yaya.ui.screens.onboarding

import android.util.Log
import com.example.yaya.data.repository.WhatsAppRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WhatsAppState(
    val status: String = "disconnected",
    val qrDataUrl: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class WhatsAppConnectionDelegate(
    private val whatsAppRepository: WhatsAppRepository,
    private val scope: CoroutineScope
) {
    private val _state = MutableStateFlow(WhatsAppState())
    val state: StateFlow<WhatsAppState> = _state.asStateFlow()

    private var statusPollingJob: Job? = null
    private var qrPollingJob: Job? = null

    fun loadStatus() {
        scope.launch {
            whatsAppRepository.getStatus().fold(
                onSuccess = { dto ->
                    _state.update { it.copy(status = dto.connectionStatus, error = null) }
                    if (dto.qrAvailable) loadQr()
                },
                onFailure = { err ->
                    Log.e(TAG, "Error loading WhatsApp status", err)
                }
            )
        }
    }

    fun loadQr() {
        scope.launch {
            whatsAppRepository.getQr().onSuccess { dto ->
                _state.update { it.copy(qrDataUrl = dto.qr) }
            }
        }
    }

    fun connect() {
        scope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            whatsAppRepository.connect().fold(
                onSuccess = {
                    _state.update { it.copy(isLoading = false, status = "connecting") }
                    delay(2000)
                    loadStatus()
                },
                onFailure = { err ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = err.message ?: "Error al conectar WhatsApp"
                        )
                    }
                }
            )
        }
    }

    fun startPolling() {
        stopPolling()
        statusPollingJob = scope.launch {
            while (true) {
                delay(10_000)
                whatsAppRepository.getStatus().onSuccess { dto ->
                    _state.update { it.copy(status = dto.connectionStatus) }
                }
            }
        }
        qrPollingJob = scope.launch {
            while (true) {
                delay(5_000)
                if (_state.value.status != "connected") {
                    whatsAppRepository.getQr().onSuccess { dto ->
                        _state.update { it.copy(qrDataUrl = dto.qr) }
                    }
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

    companion object {
        private const val TAG = "WhatsAppDelegate"
    }
}
