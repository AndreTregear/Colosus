package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class AnalyticsSummaryDto(
    val todayRevenue: Double,
    val todayExpenses: Double,
    val todayProfit: Double,
    val pendingPayments: Double,
    val revenueTrend: Double = 0.0,
    val expensesTrend: Double = 0.0,
    val profitTrend: Double = 0.0,
    val pendingTrend: Double = 0.0
)

@JsonClass(generateAdapter = true)
data class RevenueDataDto(
    val points: List<DataPointDto>,
    val total: Double
)

@JsonClass(generateAdapter = true)
data class DataPointDto(
    val label: String,
    val value: Double
)

@JsonClass(generateAdapter = true)
data class ExpensesDataDto(
    val categories: List<CategoryExpenseDto>,
    val total: Double
)

@JsonClass(generateAdapter = true)
data class CategoryExpenseDto(
    val category: String,
    val amount: Double,
    val percentage: Double = 0.0
)

@JsonClass(generateAdapter = true)
data class TopProductsDto(
    val products: List<TopProductItemDto>
)

@JsonClass(generateAdapter = true)
data class TopProductItemDto(
    val name: String,
    val quantity: Int,
    val revenue: Double
)

@JsonClass(generateAdapter = true)
data class PaymentMethodBreakdownDto(
    val methods: List<PaymentMethodDto>
)

@JsonClass(generateAdapter = true)
data class PaymentMethodDto(
    val method: String,
    val amount: Double,
    val percentage: Double
)
