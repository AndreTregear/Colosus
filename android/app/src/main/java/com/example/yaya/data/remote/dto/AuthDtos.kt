package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class MobileRegisterRequest(
    val phone: String,
    val password: String,
    val businessName: String,
    val name: String? = null,
    val email: String? = null
)

@JsonClass(generateAdapter = true)
data class MobileLoginRequest(
    val phone: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class AuthResponse(
    val token: String,
    val refreshToken: String? = null,
    val tenant: TenantDto,
    val user: UserDto,
    val subscription: PlatformSubscriptionStatus? = null
)

@JsonClass(generateAdapter = true)
data class TenantDto(
    val id: String,
    val name: String,
    val slug: String,
    val apiKey: String
)

@JsonClass(generateAdapter = true)
data class UserDto(
    val id: Int,
    val name: String?,
    val phone: String
)

@JsonClass(generateAdapter = true)
data class RefreshTokenRequest(
    val refreshToken: String
)

@JsonClass(generateAdapter = true)
data class RefreshTokenResponse(
    val token: String,
    val refreshToken: String? = null
)
