package com.example.yaya.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.repository.NotificationSettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationSettingsUiState(
    val enabled: Boolean = true,
    val time: String = "06:00",
    val timezone: String = "America/Lima",
    val lastSent: String? = null,
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val error: String? = null,
    val saveSuccess: Boolean = false,
    val showTimePicker: Boolean = false
)

@HiltViewModel
class NotificationSettingsViewModel @Inject constructor(
    private val repository: NotificationSettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationSettingsUiState())
    val uiState: StateFlow<NotificationSettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getSettings().fold(
                onSuccess = { settings ->
                    _uiState.update {
                        it.copy(
                            enabled = settings.enabled,
                            time = settings.time,
                            timezone = settings.timezone,
                            lastSent = settings.lastSent,
                            isLoading = false
                        )
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

    fun setEnabled(enabled: Boolean) {
        _uiState.update { it.copy(enabled = enabled, saveSuccess = false) }
        saveSettings()
    }

    fun setTime(hour: Int, minute: Int) {
        val time = "%02d:%02d".format(hour, minute)
        _uiState.update { it.copy(time = time, showTimePicker = false, saveSuccess = false) }
        saveSettings()
    }

    fun setTimezone(timezone: String) {
        _uiState.update { it.copy(timezone = timezone, saveSuccess = false) }
        saveSettings()
    }

    fun showTimePicker() {
        _uiState.update { it.copy(showTimePicker = true) }
    }

    fun dismissTimePicker() {
        _uiState.update { it.copy(showTimePicker = false) }
    }

    private fun saveSettings() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }
            val state = _uiState.value
            repository.updateSettings(state.enabled, state.time, state.timezone).fold(
                onSuccess = {
                    _uiState.update { it.copy(isSaving = false, saveSuccess = true) }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isSaving = false, error = error.message)
                    }
                }
            )
        }
    }

    companion object {
        val TIMEZONES = listOf(
            "America/Lima" to "Peru (Lima)",
            "America/Bogota" to "Colombia (Bogota)",
            "America/Mexico_City" to "Mexico (CDMX)",
            "America/Santiago" to "Chile (Santiago)",
            "America/Argentina/Buenos_Aires" to "Argentina (Buenos Aires)",
            "America/Guayaquil" to "Ecuador (Guayaquil)",
            "America/La_Paz" to "Bolivia (La Paz)",
            "America/Asuncion" to "Paraguay (Asuncion)"
        )
    }
}
