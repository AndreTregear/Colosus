package com.example.yaya.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.repository.DashboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val productsCount: Int = 0,
    val todayOrdersCount: Int = 0,
    val pendingPaymentsCount: Int = 0,
    val todayRevenue: Double = 0.0,
    val connectionStatus: String = "disconnected",
    val businessName: String = "",
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val authPreferences: AuthPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        collectBusinessName()
    }

    private fun collectBusinessName() {
        viewModelScope.launch {
            authPreferences.businessName.collect { name ->
                _uiState.update { it.copy(businessName = name) }
            }
        }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            val isRefresh = _uiState.value.productsCount > 0 || _uiState.value.todayOrdersCount > 0
            _uiState.update {
                it.copy(
                    isLoading = !isRefresh,
                    isRefreshing = isRefresh,
                    error = null
                )
            }
            val result = dashboardRepository.getDashboard()
            result.fold(
                onSuccess = { dto ->
                    _uiState.update {
                        it.copy(
                            productsCount = dto.productsCount,
                            todayOrdersCount = dto.todayOrdersCount,
                            pendingPaymentsCount = dto.pendingPaymentsCount,
                            todayRevenue = dto.todayRevenue,
                            connectionStatus = dto.connectionStatus,
                            isLoading = false,
                            isRefreshing = false
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = error.message
                        )
                    }
                }
            )
        }
    }
}
