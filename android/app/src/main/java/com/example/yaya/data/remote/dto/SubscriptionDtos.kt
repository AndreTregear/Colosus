package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CreatorPlanDto(
    val id: Int,
    val tenantId: String,
    val name: String,
    val description: String?,
    val price: Double,
    val billingCycle: String,
    val contentType: String,
    val features: Map<String, Any> = emptyMap(),
    val active: Boolean,
    val createdAt: String
)

@JsonClass(generateAdapter = true)
data class CustomerSubscriptionDto(
    val id: Int,
    val tenantId: String,
    val customerId: Int,
    val planId: Int,
    val status: String,
    val currentPeriodStart: String,
    val currentPeriodEnd: String,
    val cancelledAt: String?,
    val createdAt: String
)

@JsonClass(generateAdapter = true)
data class CustomerSubscriptionListResponse(
    val subscriptions: List<CustomerSubscriptionDto>,
    val total: Int
)

@JsonClass(generateAdapter = true)
data class SubscribeCustomerRequest(
    val customerId: Int,
    val planId: Int
)

// ── Platform Subscription (tenant's own plan status) ──

@JsonClass(generateAdapter = true)
data class PlatformSubscriptionStatus(
    val planSlug: String,
    val planName: String,
    val isPaid: Boolean,
    val isActive: Boolean,
    val messagesUsed: Int,
    val messagesLimit: Int,
    val canSendMessages: Boolean,
    val currentPeriodEnd: String?,
    val billingCycle: String
)

@JsonClass(generateAdapter = true)
data class PlatformPlanDto(
    val id: Int,
    val name: String,
    val slug: String,
    val description: String?,
    val price: Double,
    val billingCycle: String,
    val features: Map<String, Any> = emptyMap(),
    val limits: Map<String, Any> = emptyMap(),
    val sortOrder: Int,
    val active: Boolean
)

@JsonClass(generateAdapter = true)
data class SubscribePlanRequest(
    val planId: Int
)
