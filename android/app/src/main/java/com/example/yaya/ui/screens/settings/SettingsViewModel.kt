package com.example.yaya.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val notificationAccessEnabled: Boolean = false,
    val backendUrl: String = "",
    val businessName: String = "",
    val isTestingConnection: Boolean = false,
    val connectionTestResult: String? = null
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val appConfigPreferences: AppConfigPreferences,
    private val authPreferences: AuthPreferences,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            appConfigPreferences.backendUrl.collect { url ->
                _uiState.update { it.copy(backendUrl = url) }
            }
        }
        viewModelScope.launch {
            authPreferences.businessName.collect { name ->
                _uiState.update { it.copy(businessName = name) }
            }
        }
    }

    fun updateBackendUrl(url: String) {
        _uiState.update { it.copy(backendUrl = url, connectionTestResult = null) }
    }

    fun saveBackendUrl() {
        viewModelScope.launch {
            appConfigPreferences.setBackendUrl(_uiState.value.backendUrl)
        }
    }

    fun testConnection() {
        viewModelScope.launch {
            _uiState.update { it.copy(isTestingConnection = true, connectionTestResult = null) }

            appConfigPreferences.setBackendUrl(_uiState.value.backendUrl)

            val result = authRepository.testConnection()
            _uiState.update {
                it.copy(
                    isTestingConnection = false,
                    connectionTestResult = result.fold(
                        onSuccess = { "Conexion exitosa" },
                        onFailure = { error -> "Error: ${error.message}" }
                    )
                )
            }
        }
    }

    fun checkNotificationAccess(enabledListeners: String?) {
        val enabled = enabledListeners?.contains("com.example.yaya") == true
        _uiState.update { it.copy(notificationAccessEnabled = enabled) }
    }
}
