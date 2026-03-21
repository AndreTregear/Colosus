package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.AnalyticsSummaryDto
import com.example.yaya.data.remote.dto.ExpensesDataDto
import com.example.yaya.data.remote.dto.RevenueDataDto
import com.example.yaya.data.remote.dto.TopProductsDto
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getSummary(period: String = "today"): Result<AnalyticsSummaryDto> =
        safeApiCall { apiService.getAnalyticsSummary(period) }

    suspend fun getRevenue(period: String = "7d"): Result<RevenueDataDto> =
        safeApiCall { apiService.getAnalyticsRevenue(period) }

    suspend fun getExpenses(period: String = "7d"): Result<ExpensesDataDto> =
        safeApiCall { apiService.getAnalyticsExpenses(period) }

    suspend fun getTopProducts(period: String = "7d", limit: Int = 10): Result<TopProductsDto> =
        safeApiCall { apiService.getAnalyticsTopProducts(period, limit) }
}
