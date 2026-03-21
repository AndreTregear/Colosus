package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ProductDto(
    val id: Int,
    val tenantId: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val productType: String,
    val stock: Int?,
    val imageUrl: String?,
    val active: Boolean,
    val createdAt: String,
    val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class CreateProductRequest(
    val name: String,
    val description: String = "",
    val price: Double,
    val category: String = "general",
    val productType: String = "physical",
    val stock: Int? = null,
    val active: Boolean = true,
    val imageUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class UpdateProductRequest(
    val name: String? = null,
    val description: String? = null,
    val price: Double? = null,
    val category: String? = null,
    val stock: Int? = null,
    val active: Boolean? = null,
    val imageUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class ImageUploadResponse(
    val imageUrl: String
)
