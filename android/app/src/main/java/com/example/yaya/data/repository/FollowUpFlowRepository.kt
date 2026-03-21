package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.FollowUpFlowDto
import com.example.yaya.data.remote.dto.ToggleFlowRequest
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FollowUpFlowRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getFlows(): Result<List<FollowUpFlowDto>> =
        safeApiCall { apiService.getFollowUpFlows() }

    suspend fun toggleFlow(type: String, enabled: Boolean): Result<Unit> =
        safeApiCall { apiService.toggleFollowUpFlow(type, ToggleFlowRequest(enabled)) }.map { }
}
