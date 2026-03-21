package com.example.yaya.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val businessName: String = "",
    val phoneNumber: String = "",
    val tenantId: String = ""
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val logoutUseCase: LogoutUseCase,
    private val authPreferences: AuthPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        collectPreferences()
    }

    private fun collectPreferences() {
        viewModelScope.launch {
            authPreferences.businessName.collect { name ->
                _uiState.update { it.copy(businessName = name) }
            }
        }
        viewModelScope.launch {
            authPreferences.phoneNumber.collect { phone ->
                _uiState.update { it.copy(phoneNumber = phone) }
            }
        }
        viewModelScope.launch {
            authPreferences.tenantId.collect { id ->
                _uiState.update { it.copy(tenantId = id) }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            logoutUseCase()
        }
    }
}
