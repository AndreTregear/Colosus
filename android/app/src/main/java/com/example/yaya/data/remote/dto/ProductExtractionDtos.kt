package com.example.yaya.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ExtractionResponse(
    val status: String,
    val transcription: String? = null,
    val clarifyingQuestion: String? = null,
    val missingFields: List<String>? = null,
    val products: List<ExtractedProduct>? = null,
    val sessionId: String? = null,
    val createdCount: Int? = null,
    val confidence: String? = null
)

@JsonClass(generateAdapter = true)
data class ExtractedProduct(
    val id: Int? = null,
    val name: String,
    val price: Double,
    val description: String? = null,
    val category: String? = null,
    val variants: List<String>? = null
)

@JsonClass(generateAdapter = true)
data class VoiceExtractionTextRequest(
    val text: String? = null,
    val sessionId: String? = null,
    val confirmedProducts: List<ExtractedProduct>? = null
)
