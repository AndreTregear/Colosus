package com.example.yaya.ui.screens.payments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.model.Payment
import com.example.yaya.data.model.PaymentStatus
import com.example.yaya.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaymentListUiState(
    val payments: List<Payment> = emptyList(),
    val selectedFilter: PaymentFilter = PaymentFilter.ALL
)

enum class PaymentFilter {
    ALL, PENDING, CONFIRMED, REJECTED, EXPIRED
}

@HiltViewModel
class PaymentListViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PaymentListUiState())
    val uiState: StateFlow<PaymentListUiState> = _uiState.asStateFlow()

    private var collectJob: Job? = null

    init {
        setFilter(PaymentFilter.ALL)
    }

    fun setFilter(filter: PaymentFilter) {
        _uiState.update { it.copy(selectedFilter = filter) }
        collectJob?.cancel()
        collectJob = viewModelScope.launch {
            val flow = when (filter) {
                PaymentFilter.ALL -> paymentRepository.getAllPayments()
                PaymentFilter.PENDING -> paymentRepository.getByStatus(PaymentStatus.PENDING)
                PaymentFilter.CONFIRMED -> paymentRepository.getByStatus(PaymentStatus.CONFIRMED)
                PaymentFilter.REJECTED -> paymentRepository.getByStatus(PaymentStatus.REJECTED)
                PaymentFilter.EXPIRED -> paymentRepository.getByStatus(PaymentStatus.EXPIRED)
            }
            flow.collect { payments ->
                _uiState.update { it.copy(payments = payments) }
            }
        }
    }
}
