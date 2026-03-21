package com.example.yaya.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.model.CountryCode
import com.example.yaya.data.model.CountryCodes
import com.example.yaya.data.repository.AuthRepository
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

data class RegisterUiState(
    val businessName: String = "",
    val name: String = "",
    val phone: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val email: String = "",
    val selectedCountryCode: CountryCode = CountryCodes.default,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RegisterUiState())
    val uiState: StateFlow<RegisterUiState> = _uiState.asStateFlow()

    private val _registerSuccess = MutableSharedFlow<Unit>()
    val registerSuccess: SharedFlow<Unit> = _registerSuccess.asSharedFlow()

    fun onBusinessNameChange(businessName: String) {
        _uiState.update { it.copy(businessName = businessName, error = null) }
    }

    fun onNameChange(name: String) {
        _uiState.update { it.copy(name = name, error = null) }
    }

    fun onPhoneChange(phone: String) {
        _uiState.update { it.copy(phone = phone, error = null) }
    }

    fun onPasswordChange(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun onConfirmPasswordChange(confirmPassword: String) {
        _uiState.update { it.copy(confirmPassword = confirmPassword, error = null) }
    }

    fun onEmailChange(email: String) {
        _uiState.update { it.copy(email = email, error = null) }
    }

    fun onCountryCodeChange(countryCode: CountryCode) {
        _uiState.update { it.copy(selectedCountryCode = countryCode) }
    }

    fun register() {
        val state = _uiState.value

        if (state.businessName.isBlank()) {
            _uiState.update { it.copy(error = "Ingresa el nombre del negocio") }
            return
        }
        if (state.phone.isBlank()) {
            _uiState.update { it.copy(error = "Ingresa tu numero de telefono") }
            return
        }
        if (state.password.length < 6) {
            _uiState.update { it.copy(error = "La contrasena debe tener al menos 6 caracteres") }
            return
        }
        if (state.password != state.confirmPassword) {
            _uiState.update { it.copy(error = "Las contrasenas no coinciden") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val result = authRepository.register(
                phone = state.phone,
                countryCode = state.selectedCountryCode.code,
                password = state.password,
                businessName = state.businessName,
                name = state.name.ifBlank { null },
                email = state.email.ifBlank { null }
            )

            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false) }
                    _registerSuccess.emit(Unit)
                },
                onFailure = { exception ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = exception.message ?: "Error al crear la cuenta"
                        )
                    }
                }
            )
        }
    }
}
