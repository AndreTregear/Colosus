package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class DashboardDto(
    val productsCount: Int,
    val ordersCount: Int,
    val pendingOrdersCount: Int,
    val pendingPaymentsCount: Int,
    val todayOrdersCount: Int,
    val todayRevenue: Double,
    val connectionStatus: String
)
