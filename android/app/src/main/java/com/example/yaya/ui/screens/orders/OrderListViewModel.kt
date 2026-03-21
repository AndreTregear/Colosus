package com.example.yaya.ui.screens.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.OrderDto
import com.example.yaya.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderListUiState(
    val orders: List<OrderDto> = emptyList(),
    val total: Int = 0,
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedFilter: OrderFilter = OrderFilter.ALL
)

enum class OrderFilter(val label: String, val apiValue: String?) {
    ALL("Todos", null),
    PENDING("Pendientes", "pending"),
    CONFIRMED("Confirmados", "confirmed"),
    PAYMENT_REQUESTED("Pago solicitado", "payment_requested"),
    PAID("Pagados", "paid"),
    PREPARING("Preparando", "preparing"),
    SHIPPED("Enviados", "shipped"),
    DELIVERED("Entregados", "delivered"),
    CANCELLED("Cancelados", "cancelled")
}

@HiltViewModel
class OrderListViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderListUiState())
    val uiState: StateFlow<OrderListUiState> = _uiState.asStateFlow()

    init {
        loadOrders()
    }

    fun setFilter(filter: OrderFilter) {
        _uiState.update { it.copy(selectedFilter = filter) }
        loadOrders()
    }

    fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val state = _uiState.value
            val result = orderRepository.getOrders(
                limit = 50,
                offset = 0,
                status = state.selectedFilter.apiValue
            )
            result.fold(
                onSuccess = { response ->
                    _uiState.update {
                        it.copy(
                            orders = response.orders,
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

    fun refresh() = loadOrders()
}
