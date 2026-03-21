package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.PlatformPlanDto
import com.example.yaya.data.remote.dto.PlatformSubscriptionStatus
import com.example.yaya.data.remote.dto.SubscribePlanRequest
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlatformSubscriptionRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getSubscriptionStatus(): Result<PlatformSubscriptionStatus> =
        safeApiCall { apiService.getPlatformSubscription() }

    suspend fun getPlans(): Result<List<PlatformPlanDto>> =
        safeApiCall { apiService.getPlatformPlans() }

    suspend fun subscribe(planId: Int): Result<PlatformSubscriptionStatus> =
        safeApiCall { apiService.subscribeToPlan(SubscribePlanRequest(planId)) }
}
