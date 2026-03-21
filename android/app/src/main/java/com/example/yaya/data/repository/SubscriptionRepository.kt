package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.CreatorPlanDto
import com.example.yaya.data.remote.dto.CustomerSubscriptionDto
import com.example.yaya.data.remote.dto.CustomerSubscriptionListResponse
import com.example.yaya.data.remote.dto.SubscribeCustomerRequest
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SubscriptionRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getCreatorPlans(): Result<List<CreatorPlanDto>> =
        safeApiCall { apiService.getCreatorPlans() }

    suspend fun getCustomerSubscriptions(
        status: String? = null,
        limit: Int = 50,
        offset: Int = 0
    ): Result<CustomerSubscriptionListResponse> =
        safeApiCall { apiService.getCustomerSubscriptions(status, limit, offset) }

    suspend fun subscribeCustomer(customerId: Int, planId: Int): Result<CustomerSubscriptionDto> =
        safeApiCall { apiService.subscribeCustomer(SubscribeCustomerRequest(customerId, planId)) }

    suspend fun cancelSubscription(subscriptionId: Int): Result<CustomerSubscriptionDto> =
        safeApiCall { apiService.cancelCustomerSubscription(subscriptionId) }
}
