package com.example.yaya.ui.screens.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.CreateProductRequest
import com.example.yaya.data.repository.AuthRepository
import com.example.yaya.data.repository.ProductRepository
import com.example.yaya.data.repository.WhatsAppRepository
import com.example.yaya.domain.usecase.CompleteOnboardingUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class OnboardingStep {
    WELCOME,
    BUSINESS_TYPE,
    BUSINESS_INFO,
    ACCOUNT_CREATION,
    WHATSAPP_CONNECTION,
    FIRST_PRODUCT,
    NOTIFICATION_ACCESS,
    DONE
}

data class OnboardingUiState(
    val step: OnboardingStep = OnboardingStep.WELCOME,
    val businessType: String = "",
    val businessName: String = "",
    val phoneNumber: String = "",
    val countryCode: String = "+51",
    val address: String = "",
    val yapeNumber: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val whatsappStatus: String = "disconnected",
    val qrDataUrl: String? = null,
    val firstProductName: String = "",
    val firstProductPrice: String = "",
    val firstProductAdded: Boolean = false,
    val notificationAccessEnabled: Boolean = false,
    val isLoginMode: Boolean = false,
    val currentStepIndex: Int = 0,
    val totalSteps: Int = 8
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val productRepository: ProductRepository,
    whatsAppRepository: WhatsAppRepository,
    private val completeOnboardingUseCase: CompleteOnboardingUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(OnboardingUiState())
    val uiState: StateFlow<OnboardingUiState> = _uiState.asStateFlow()

    private val stepManager = OnboardingStepManager()
    private val whatsAppDelegate = WhatsAppConnectionDelegate(whatsAppRepository, viewModelScope)

    init {
        viewModelScope.launch {
            whatsAppDelegate.state.collect { wa ->
                _uiState.update {
                    it.copy(
                        whatsappStatus = wa.status,
                        qrDataUrl = wa.qrDataUrl,
                        isLoading = if (it.step == OnboardingStep.WHATSAPP_CONNECTION) wa.isLoading else it.isLoading,
                        error = if (it.step == OnboardingStep.WHATSAPP_CONNECTION) wa.error else it.error
                    )
                }
            }
        }
    }

    // ── Step navigation ─────────────────────────────

    fun nextStep() {
        val state = _uiState.value
        val validationError = stepManager.validate(state)
        if (validationError != null) {
            _uiState.update { it.copy(error = validationError) }
            return
        }
        stepManager.nextStep(state.step)?.let { result ->
            _uiState.update { it.copy(step = result.step, currentStepIndex = result.index, error = null) }
            onStepEntered(result.step)
        }
    }

    fun previousStep() {
        whatsAppDelegate.stopPolling()
        stepManager.previousStep(_uiState.value.step)?.let { result ->
            _uiState.update { it.copy(step = result.step, currentStepIndex = result.index, error = null) }
            onStepEntered(result.step)
        }
    }

    fun skipStep() {
        if (!stepManager.canSkip(_uiState.value.step)) return
        whatsAppDelegate.stopPolling()
        stepManager.nextStep(_uiState.value.step)?.let { result ->
            _uiState.update { it.copy(step = result.step, currentStepIndex = result.index, error = null) }
            onStepEntered(result.step)
        }
    }

    private fun onStepEntered(step: OnboardingStep) {
        if (step == OnboardingStep.WHATSAPP_CONNECTION) {
            whatsAppDelegate.loadStatus()
            whatsAppDelegate.startPolling()
        } else {
            whatsAppDelegate.stopPolling()
        }
    }

    // ── Field updaters ──────────────────────────────

    fun updateBusinessType(type: String) {
        _uiState.update { it.copy(businessType = type, error = null) }
    }

    fun updateBusinessName(name: String) {
        _uiState.update { it.copy(businessName = name, error = null) }
    }

    fun updatePhoneNumber(phone: String) {
        _uiState.update { it.copy(phoneNumber = phone, error = null) }
    }

    fun updateCountryCode(code: String) {
        _uiState.update { it.copy(countryCode = code, error = null) }
    }

    fun updateAddress(address: String) {
        _uiState.update { it.copy(address = address, error = null) }
    }

    fun updateYapeNumber(yapeNumber: String) {
        _uiState.update { it.copy(yapeNumber = yapeNumber, error = null) }
    }

    fun updatePassword(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun updateConfirmPassword(confirmPassword: String) {
        _uiState.update { it.copy(confirmPassword = confirmPassword, error = null) }
    }

    fun updateFirstProductName(name: String) {
        _uiState.update { it.copy(firstProductName = name, error = null) }
    }

    fun updateFirstProductPrice(price: String) {
        _uiState.update { it.copy(firstProductPrice = price, error = null) }
    }

    fun toggleLoginMode() {
        _uiState.update {
            it.copy(isLoginMode = !it.isLoginMode, error = null, password = "", confirmPassword = "")
        }
    }

    // ── Account creation ────────────────────────────

    fun registerOrLogin() {
        val state = _uiState.value
        if (state.phoneNumber.isBlank()) {
            _uiState.update { it.copy(error = "Ingresa tu numero de telefono") }
            return
        }
        if (state.password.length < 6) {
            _uiState.update { it.copy(error = "La contrasena debe tener al menos 6 caracteres") }
            return
        }
        if (!state.isLoginMode && state.password != state.confirmPassword) {
            _uiState.update { it.copy(error = "Las contrasenas no coinciden") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val result = if (state.isLoginMode) {
                authRepository.login(state.phoneNumber, state.countryCode, state.password)
            } else {
                authRepository.register(
                    state.phoneNumber, state.countryCode, state.password,
                    state.businessName, null, null
                )
            }

            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false) }
                    nextStep()
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: if (state.isLoginMode) "Error al iniciar sesion"
                                else "Error al crear la cuenta"
                        )
                    }
                }
            )
        }
    }

    // ── WhatsApp (delegated) ────────────────────────

    fun loadWhatsAppStatus() = whatsAppDelegate.loadStatus()
    fun loadQr() = whatsAppDelegate.loadQr()
    fun connectWhatsApp() = whatsAppDelegate.connect()

    // ── First product ───────────────────────────────

    fun addFirstProduct() {
        val state = _uiState.value
        if (state.firstProductName.isBlank()) {
            _uiState.update { it.copy(error = "Ingresa el nombre del producto") }
            return
        }
        val price = state.firstProductPrice.toDoubleOrNull()
        if (price == null || price <= 0) {
            _uiState.update { it.copy(error = "Ingresa un precio valido") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            productRepository.createProduct(CreateProductRequest(name = state.firstProductName, price = price)).fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, firstProductAdded = true, error = null) }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message ?: "Error al crear el producto")
                    }
                }
            )
        }
    }

    // ── Notification access ─────────────────────────

    fun checkNotificationAccess(enabledListeners: String?) {
        val enabled = enabledListeners?.contains("com.example.yaya") == true
        _uiState.update { it.copy(notificationAccessEnabled = enabled) }
    }

    // ── Complete onboarding ─────────────────────────

    fun completeOnboarding() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val state = _uiState.value
            completeOnboardingUseCase(
                businessType = state.businessType,
                businessName = state.businessName,
                address = state.address,
                yapeNumber = state.yapeNumber
            )
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    override fun onCleared() {
        super.onCleared()
        whatsAppDelegate.stopPolling()
    }
}
