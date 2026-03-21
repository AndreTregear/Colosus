package com.example.yaya.ui.screens.store

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.PlatformPlanDto
import com.example.yaya.data.remote.dto.PlatformSubscriptionStatus
import com.example.yaya.data.repository.PlatformSubscriptionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class StoreUiState(
    val subscription: PlatformSubscriptionStatus? = null,
    val plans: List<PlatformPlanDto> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val subscribing: Boolean = false,
    val actionMessage: String? = null
)

@HiltViewModel
class StoreViewModel @Inject constructor(
    private val repository: PlatformSubscriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StoreUiState())
    val uiState: StateFlow<StoreUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val subsResult = repository.getSubscriptionStatus()
            val plansResult = repository.getPlans()

            subsResult.fold(
                onSuccess = { sub ->
                    _uiState.update { it.copy(subscription = sub) }
                },
                onFailure = { e ->
                    _uiState.update { it.copy(error = e.message) }
                }
            )

            plansResult.fold(
                onSuccess = { plans ->
                    _uiState.update { it.copy(plans = plans.filter { p -> p.active }) }
                },
                onFailure = { e ->
                    if (_uiState.value.error == null) {
                        _uiState.update { it.copy(error = e.message) }
                    }
                }
            )

            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun subscribeToPlan(planId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(subscribing = true, actionMessage = null) }

            repository.subscribe(planId).fold(
                onSuccess = { newStatus ->
                    _uiState.update {
                        it.copy(
                            subscription = newStatus,
                            subscribing = false,
                            actionMessage = "Suscripcion activada"
                        )
                    }
                },
                onFailure = { e ->
                    _uiState.update {
                        it.copy(
                            subscribing = false,
                            actionMessage = e.message ?: "Error al suscribirse"
                        )
                    }
                }
            )
        }
    }

    fun clearActionMessage() {
        _uiState.update { it.copy(actionMessage = null) }
    }
}
