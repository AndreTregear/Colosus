package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.DashboardDto
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DashboardRepository @Inject constructor(
    private val apiService: YayaApiService
) {
    suspend fun getDashboard(): Result<DashboardDto> =
        safeApiCall { apiService.getDashboard() }
}
