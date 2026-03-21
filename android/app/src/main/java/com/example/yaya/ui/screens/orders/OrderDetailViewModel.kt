package com.example.yaya.ui.screens.orders

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.OrderDetailDto
import com.example.yaya.data.remote.dto.PendingPaymentDto
import com.example.yaya.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderDetailUiState(
    val order: OrderDetailDto? = null,
    val pendingPayments: List<PendingPaymentDto> = emptyList(),
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val error: String? = null,
    val actionSuccess: String? = null
)

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val orderId: Int = savedStateHandle["orderId"] ?: 0

    private val _uiState = MutableStateFlow(OrderDetailUiState())
    val uiState: StateFlow<OrderDetailUiState> = _uiState.asStateFlow()

    init {
        loadOrder()
    }

    fun loadOrder() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val orderResult = orderRepository.getOrderById(orderId)
            orderResult.fold(
                onSuccess = { order ->
                    _uiState.update { it.copy(order = order, isLoading = false) }
                    // Load pending payments for this order
                    loadPendingPayments()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, error = error.message) }
                }
            )
        }
    }

    private fun loadPendingPayments() {
        viewModelScope.launch {
            val result = orderRepository.getPendingPayments()
            result.onSuccess { payments ->
                // Filter to payments for this specific order
                val orderPayments = payments.filter { it.orderId == orderId }
                _uiState.update { it.copy(pendingPayments = orderPayments) }
            }
        }
    }

    fun updateStatus(newStatus: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUpdating = true, error = null, actionSuccess = null) }
            val result = orderRepository.updateOrderStatus(orderId, newStatus)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isUpdating = false, actionSuccess = "Estado actualizado") }
                    loadOrder()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isUpdating = false, error = error.message) }
                }
            )
        }
    }

    fun confirmPayment(paymentId: Int, reference: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUpdating = true, error = null, actionSuccess = null) }
            val result = orderRepository.confirmPayment(paymentId, reference)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isUpdating = false, actionSuccess = "Pago confirmado") }
                    loadOrder()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isUpdating = false, error = error.message) }
                }
            )
        }
    }

    fun rejectPayment(paymentId: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isUpdating = true, error = null, actionSuccess = null) }
            val result = orderRepository.rejectPayment(paymentId)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isUpdating = false, actionSuccess = "Pago rechazado") }
                    loadOrder()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isUpdating = false, error = error.message) }
                }
            )
        }
    }
}
