package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class CustomerListResponse(
    val customers: List<CustomerDto>,
    val total: Int,
    val limit: Int,
    val offset: Int
)

@JsonClass(generateAdapter = true)
data class CustomerDto(
    val id: Int,
    val tenantId: String,
    val channel: String,
    val jid: String,
    val name: String?,
    val phone: String?,
    val location: String?,
    val address: String?,
    val notes: String?,
    val createdAt: String,
    val updatedAt: String
)
