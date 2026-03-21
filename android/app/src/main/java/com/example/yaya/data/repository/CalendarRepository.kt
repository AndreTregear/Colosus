package com.example.yaya.data.repository

import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.CalendarCallbackRequest
import com.example.yaya.data.remote.dto.CalendarCallbackResponse
import com.example.yaya.data.remote.dto.CalendarEventDto
import com.example.yaya.data.remote.dto.CalendarStatusResponse
import com.example.yaya.data.remote.safeApiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CalendarRepository @Inject constructor(
    private val apiService: YayaApiService
) {

    suspend fun getAuthUrl(): Result<String> =
        safeApiCall { apiService.getCalendarAuthUrl() }.map { it.authUrl }

    suspend fun handleCallback(code: String): Result<CalendarCallbackResponse> =
        safeApiCall { apiService.calendarCallback(CalendarCallbackRequest(code)) }

    suspend fun getStatus(): Result<CalendarStatusResponse> =
        safeApiCall { apiService.getCalendarStatus() }

    suspend fun disconnect(): Result<Unit> =
        safeApiCall { apiService.disconnectCalendar() }.map { }

    suspend fun getEvents(days: Int = 7): Result<List<CalendarEventDto>> =
        safeApiCall { apiService.getCalendarEvents(days = days) }.map { it.events }

    suspend fun deleteEvent(eventId: String): Result<Unit> =
        safeApiCall { apiService.deleteCalendarEvent(eventId) }.map { }
}
