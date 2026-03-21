package com.example.yaya.ui.screens.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.CategoryExpenseDto
import com.example.yaya.data.remote.dto.DataPointDto
import com.example.yaya.data.remote.dto.TopProductItemDto
import com.example.yaya.data.repository.AnalyticsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class DateRange(val label: String, val apiValue: String) {
    TODAY("Hoy", "today"),
    WEEK("Esta semana", "7d"),
    MONTH("Este mes", "30d")
}

data class AnalyticsUiState(
    val todayRevenue: Double = 0.0,
    val todayExpenses: Double = 0.0,
    val todayProfit: Double = 0.0,
    val pendingPayments: Double = 0.0,
    val revenueTrend: Double = 0.0,
    val expensesTrend: Double = 0.0,
    val profitTrend: Double = 0.0,
    val pendingTrend: Double = 0.0,
    val revenuePoints: List<DataPointDto> = emptyList(),
    val expenseCategories: List<CategoryExpenseDto> = emptyList(),
    val topProducts: List<TopProductItemDto> = emptyList(),
    val selectedRange: DateRange = DateRange.WEEK,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class AnalyticsViewModel @Inject constructor(
    private val analyticsRepository: AnalyticsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AnalyticsUiState())
    val uiState: StateFlow<AnalyticsUiState> = _uiState.asStateFlow()

    init {
        loadAll()
    }

    fun selectRange(range: DateRange) {
        _uiState.update { it.copy(selectedRange = range) }
        loadAll()
    }

    fun refresh() {
        loadAll(isRefresh = true)
    }

    private fun loadAll(isRefresh: Boolean = false) {
        viewModelScope.launch {
            val range = _uiState.value.selectedRange
            _uiState.update {
                it.copy(
                    isLoading = !isRefresh,
                    isRefreshing = isRefresh,
                    error = null
                )
            }

            // Load summary
            val summaryResult = analyticsRepository.getSummary(range.apiValue)
            summaryResult.fold(
                onSuccess = { dto ->
                    _uiState.update {
                        it.copy(
                            todayRevenue = dto.todayRevenue,
                            todayExpenses = dto.todayExpenses,
                            todayProfit = dto.todayProfit,
                            pendingPayments = dto.pendingPayments,
                            revenueTrend = dto.revenueTrend,
                            expensesTrend = dto.expensesTrend,
                            profitTrend = dto.profitTrend,
                            pendingTrend = dto.pendingTrend
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            )

            // Load revenue chart
            val revenueResult = analyticsRepository.getRevenue(range.apiValue)
            revenueResult.onSuccess { data ->
                _uiState.update { it.copy(revenuePoints = data.points) }
            }

            // Load expenses
            val expensesResult = analyticsRepository.getExpenses(range.apiValue)
            expensesResult.onSuccess { data ->
                _uiState.update { it.copy(expenseCategories = data.categories) }
            }

            // Load top products
            val productsResult = analyticsRepository.getTopProducts(range.apiValue)
            productsResult.onSuccess { data ->
                _uiState.update { it.copy(topProducts = data.products) }
            }

            _uiState.update { it.copy(isLoading = false, isRefreshing = false) }
        }
    }
}
