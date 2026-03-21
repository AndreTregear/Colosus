package com.example.yaya.domain.usecase

import com.example.yaya.data.remote.dto.DashboardDto
import com.example.yaya.data.repository.DashboardRepository
import com.example.yaya.data.repository.PaymentRepository
import kotlinx.coroutines.flow.first
import javax.inject.Inject

data class DashboardData(
    val dashboard: DashboardDto,
    val localPendingCount: Int,
    val localTodayTotal: Double
)

class RefreshDashboardUseCase @Inject constructor(
    private val dashboardRepository: DashboardRepository,
    private val paymentRepository: PaymentRepository
) {
    suspend operator fun invoke(): Result<DashboardData> {
        return dashboardRepository.getDashboard().map { dashboard ->
            val pendingCount = paymentRepository.getTodayCount().first()
            val todayTotal = paymentRepository.getTodayTotal().first()
            DashboardData(
                dashboard = dashboard,
                localPendingCount = pendingCount,
                localTodayTotal = todayTotal
            )
        }
    }
}
