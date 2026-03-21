package com.example.yaya.data.repository

import com.example.yaya.data.remote.ApiError
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.ExtractedProduct
import com.example.yaya.data.remote.dto.ExtractionResponse
import com.example.yaya.data.remote.dto.VoiceExtractionTextRequest
import com.example.yaya.data.remote.safeApiCall
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductExtractionRepository @Inject constructor(
    private val apiService: YayaApiService
) {

    suspend fun extractFromVoice(
        audioFile: File,
        sessionId: String? = null
    ): Result<ExtractionResponse> {
        return try {
            val audioPart = MultipartBody.Part.createFormData(
                "audio",
                audioFile.name,
                audioFile.asRequestBody("audio/*".toMediaTypeOrNull())
            )
            val sessionPart = sessionId?.toRequestBody("text/plain".toMediaTypeOrNull())
            safeApiCall { apiService.extractFromVoice(audioPart, sessionPart) }
        } catch (e: Exception) {
            Result.failure(ApiError.Unknown(e))
        }
    }

    suspend fun extractFromText(
        text: String,
        sessionId: String? = null
    ): Result<ExtractionResponse> {
        return try {
            val request = VoiceExtractionTextRequest(text = text, sessionId = sessionId)
            safeApiCall { apiService.extractFromText(request) }
        } catch (e: Exception) {
            Result.failure(ApiError.Unknown(e))
        }
    }

    suspend fun confirmProducts(
        sessionId: String,
        products: List<ExtractedProduct>
    ): Result<ExtractionResponse> {
        return try {
            val request = VoiceExtractionTextRequest(
                sessionId = sessionId,
                confirmedProducts = products
            )
            safeApiCall { apiService.extractFromText(request) }
        } catch (e: Exception) {
            Result.failure(ApiError.Unknown(e))
        }
    }

    suspend fun extractFromPhoto(
        imageFile: File,
        description: String? = null
    ): Result<ExtractionResponse> {
        return try {
            val imagePart = MultipartBody.Part.createFormData(
                "image",
                imageFile.name,
                imageFile.asRequestBody("image/*".toMediaTypeOrNull())
            )
            val descPart = description?.toRequestBody("text/plain".toMediaTypeOrNull())
            safeApiCall { apiService.extractFromPhoto(imagePart, descPart) }
        } catch (e: Exception) {
            Result.failure(ApiError.Unknown(e))
        }
    }
}
