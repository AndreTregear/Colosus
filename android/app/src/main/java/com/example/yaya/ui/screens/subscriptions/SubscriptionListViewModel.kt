package com.example.yaya.ui.screens.subscriptions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.CreatorPlanDto
import com.example.yaya.data.remote.dto.CustomerSubscriptionDto
import com.example.yaya.data.repository.SubscriptionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SubscriptionListUiState(
    val subscriptions: List<CustomerSubscriptionDto> = emptyList(),
    val plans: List<CreatorPlanDto> = emptyList(),
    val total: Int = 0,
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedFilter: SubFilter = SubFilter.ALL,
    val actionSuccess: String? = null
)

enum class SubFilter(val label: String, val apiValue: String?) {
    ALL("Todas", null),
    ACTIVE("Activas", "active"),
    PAST_DUE("Vencidas", "past_due"),
    CANCELLED("Canceladas", "cancelled"),
    EXPIRED("Expiradas", "expired")
}

@HiltViewModel
class SubscriptionListViewModel @Inject constructor(
    private val subscriptionRepository: SubscriptionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SubscriptionListUiState())
    val uiState: StateFlow<SubscriptionListUiState> = _uiState.asStateFlow()

    init {
        loadPlans()
        loadSubscriptions()
    }

    fun setFilter(filter: SubFilter) {
        _uiState.update { it.copy(selectedFilter = filter) }
        loadSubscriptions()
    }

    private fun loadPlans() {
        viewModelScope.launch {
            subscriptionRepository.getCreatorPlans().fold(
                onSuccess = { plans ->
                    _uiState.update { it.copy(plans = plans) }
                },
                onFailure = { /* plans are optional context */ }
            )
        }
    }

    fun loadSubscriptions() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val state = _uiState.value
            subscriptionRepository.getCustomerSubscriptions(
                status = state.selectedFilter.apiValue
            ).fold(
                onSuccess = { response ->
                    _uiState.update {
                        it.copy(
                            subscriptions = response.subscriptions,
                            total = response.total,
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

    fun cancelSubscription(subscriptionId: Int) {
        viewModelScope.launch {
            subscriptionRepository.cancelSubscription(subscriptionId).fold(
                onSuccess = {
                    _uiState.update { it.copy(actionSuccess = "Suscripcion cancelada") }
                    loadSubscriptions()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            )
        }
    }

    fun clearActionSuccess() {
        _uiState.update { it.copy(actionSuccess = null) }
    }

    fun refresh() = loadSubscriptions()

    fun getPlanName(planId: Int): String {
        return _uiState.value.plans.find { it.id == planId }?.name ?: "Plan #$planId"
    }

    fun getPlanPrice(planId: Int): Double {
        return _uiState.value.plans.find { it.id == planId }?.price ?: 0.0
    }
}
