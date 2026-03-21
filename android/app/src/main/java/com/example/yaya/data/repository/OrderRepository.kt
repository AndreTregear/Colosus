package com.example.yaya.data.repository

import com.example.yaya.data.local.db.OrderDao
import com.example.yaya.data.model.OrderEntity
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.ConfirmPaymentRequest
import com.example.yaya.data.remote.dto.OrderDetailDto
import com.example.yaya.data.remote.dto.OrderDto
import com.example.yaya.data.remote.dto.OrderListResponse
import com.example.yaya.data.remote.dto.PaymentActionResponse
import com.example.yaya.data.remote.dto.PendingPaymentDto
import com.example.yaya.data.remote.dto.UpdateOrderStatusRequest
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: YayaApiService,
    private val orderDao: OrderDao
) {
    suspend fun getOrders(
        limit: Int = 50,
        offset: Int = 0,
        status: String? = null
    ): Result<OrderListResponse> =
        safeApiCall { apiService.getOrders(limit, offset, status) }
            .onSuccess { response -> orderDao.insertAll(response.orders.map { it.toEntity() }) }
            .recoverCatching {
                val cached = orderDao.getAll()
                if (cached.isNotEmpty()) OrderListResponse(cached.map { it.toDto() }, cached.size)
                else throw it
            }

    suspend fun getOrderById(id: Int): Result<OrderDetailDto> =
        safeApiCall { apiService.getOrderById(id) }

    suspend fun updateOrderStatus(id: Int, status: String): Result<OrderDto> =
        safeApiCall { apiService.updateOrderStatus(id, UpdateOrderStatusRequest(status)) }

    suspend fun getPendingPayments(): Result<List<PendingPaymentDto>> =
        safeApiCall { apiService.getPendingPayments() }

    suspend fun confirmPayment(id: Int, reference: String? = null): Result<PaymentActionResponse> =
        safeApiCall { apiService.confirmPayment(id, ConfirmPaymentRequest(reference)) }

    suspend fun rejectPayment(id: Int): Result<PaymentActionResponse> =
        safeApiCall { apiService.rejectPayment(id) }
}

private fun OrderDto.toEntity() = OrderEntity(
    id = id, customerId = customerId, status = status, total = total,
    deliveryType = deliveryType, deliveryAddress = deliveryAddress,
    notes = notes, createdAt = createdAt, updatedAt = updatedAt
)

private fun OrderEntity.toDto() = OrderDto(
    id = id, tenantId = "", customerId = customerId, status = status,
    total = total, deliveryType = deliveryType, deliveryAddress = deliveryAddress,
    notes = notes, createdAt = createdAt, updatedAt = updatedAt
)
