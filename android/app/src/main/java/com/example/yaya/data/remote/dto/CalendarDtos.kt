package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CalendarAuthUrlResponse(
    val authUrl: String
)

@JsonClass(generateAdapter = true)
data class CalendarCallbackRequest(
    val code: String
)

@JsonClass(generateAdapter = true)
data class CalendarCallbackResponse(
    val success: Boolean,
    val connected: Boolean
)

@JsonClass(generateAdapter = true)
data class CalendarStatusResponse(
    val connected: Boolean,
    val email: String? = null
)

@JsonClass(generateAdapter = true)
data class CalendarEventDto(
    val id: String,
    val title: String,
    val start: String,
    val end: String,
    val description: String? = null,
    val location: String? = null,
    val link: String? = null
)

@JsonClass(generateAdapter = true)
data class CalendarEventsResponse(
    val events: List<CalendarEventDto>
)

@JsonClass(generateAdapter = true)
data class SyncAppointmentRequest(
    val title: String,
    val startTime: String,
    val endTime: String,
    val description: String? = null,
    val customerEmail: String? = null,
    val location: String? = null
)

@JsonClass(generateAdapter = true)
data class SyncAppointmentResponse(
    val success: Boolean,
    val eventId: String? = null,
    val eventLink: String? = null
)

@JsonClass(generateAdapter = true)
data class SuccessResponse(
    val success: Boolean
)
