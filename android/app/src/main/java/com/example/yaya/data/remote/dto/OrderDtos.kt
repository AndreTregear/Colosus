package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class OrderListResponse(
    val orders: List<OrderDto>,
    val total: Int
)

@JsonClass(generateAdapter = true)
data class OrderDto(
    val id: Int,
    val tenantId: String,
    val customerId: Int,
    val status: String,
    val total: Double,
    val deliveryType: String,
    val deliveryAddress: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class OrderDetailDto(
    val id: Int,
    val tenantId: String,
    val customerId: Int,
    val status: String,
    val total: Double,
    val deliveryType: String,
    val deliveryAddress: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String,
    val items: List<OrderItemDto>,
    val customerName: String?,
    val customerJid: String
)

@JsonClass(generateAdapter = true)
data class OrderItemDto(
    val id: Int,
    val orderId: Int,
    val productId: Int,
    val quantity: Int,
    val unitPrice: Double,
    val productName: String
)

@JsonClass(generateAdapter = true)
data class UpdateOrderStatusRequest(
    val status: String
)

@JsonClass(generateAdapter = true)
data class PendingPaymentDto(
    val id: Int,
    val tenantId: String,
    val orderId: Int,
    val method: String,
    val amount: Double,
    val status: String,
    val reference: String?,
    val confirmedAt: String?,
    val confirmedBy: String?,
    val createdAt: String,
    val customerName: String?,
    val customerJid: String
)

@JsonClass(generateAdapter = true)
data class ConfirmPaymentRequest(
    val reference: String? = null
)

@JsonClass(generateAdapter = true)
data class PaymentActionResponse(
    val id: Int,
    val tenantId: String,
    val orderId: Int,
    val method: String,
    val amount: Double,
    val status: String,
    val reference: String?,
    val confirmedAt: String?,
    val confirmedBy: String?,
    val createdAt: String
)
