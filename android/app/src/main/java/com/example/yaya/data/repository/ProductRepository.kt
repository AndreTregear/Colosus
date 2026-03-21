package com.example.yaya.data.repository

import android.content.Context
import android.net.Uri
import com.example.yaya.data.local.db.ProductDao
import com.example.yaya.data.model.ProductEntity
import com.example.yaya.data.remote.ApiError
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.remote.dto.CreateProductRequest
import com.example.yaya.data.remote.dto.ProductDto
import com.example.yaya.data.remote.dto.UpdateProductRequest
import com.example.yaya.data.remote.safeApiCall
import com.example.yaya.util.ImageCompressor
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProductRepository @Inject constructor(
    private val apiService: YayaApiService,
    private val productDao: ProductDao,
    @ApplicationContext private val context: Context
) {
    suspend fun getProducts(search: String? = null): Result<List<ProductDto>> =
        safeApiCall { apiService.getProducts(search = search) }
            .onSuccess { products -> productDao.insertAll(products.map { it.toEntity() }) }
            .recoverCatching {
                val cached = productDao.getAll()
                if (cached.isNotEmpty()) cached.map { it.toDto() }
                else throw it
            }

    suspend fun getProductById(id: Int): Result<ProductDto> =
        safeApiCall { apiService.getProductById(id) }

    suspend fun createProduct(request: CreateProductRequest): Result<ProductDto> =
        safeApiCall { apiService.createProduct(request) }

    suspend fun updateProduct(id: Int, request: UpdateProductRequest): Result<ProductDto> =
        safeApiCall { apiService.updateProduct(id, request) }

    suspend fun deleteProduct(id: Int): Result<Unit> =
        safeApiCall { apiService.deleteProduct(id) }

    suspend fun uploadProductImage(imageUri: Uri): Result<String> {
        return try {
            val contentResolver = context.contentResolver
            val mimeType = contentResolver.getType(imageUri) ?: "image/jpeg"

            if (!ImageCompressor.validateMimeType(mimeType)) {
                return Result.failure(ApiError.Unknown(
                    Exception("Formato no soportado. Usa JPEG, PNG o WebP")
                ))
            }

            val bytes = ImageCompressor.compressIfNeeded(context, imageUri)
                ?: return Result.failure(ApiError.Unknown(Exception("No se pudo leer la imagen")))

            // After compression, always upload as JPEG
            val uploadMime = if (bytes.size < 1_048_576) mimeType else "image/jpeg"
            val requestBody = bytes.toRequestBody(uploadMime.toMediaType())
            val ext = when (uploadMime) {
                "image/png" -> "product.png"
                "image/webp" -> "product.webp"
                else -> "product.jpg"
            }
            val part = MultipartBody.Part.createFormData("image", ext, requestBody)
            safeApiCall { apiService.uploadProductImage(part) }.map { it.imageUrl }
        } catch (e: Exception) {
            Result.failure(ApiError.Unknown(e))
        }
    }
}

private fun ProductDto.toEntity() = ProductEntity(
    id = id, name = name, description = description, price = price,
    category = category, productType = productType, stock = stock,
    imageUrl = imageUrl, active = active
)

private fun ProductEntity.toDto() = ProductDto(
    id = id, tenantId = "", name = name, description = description,
    price = price, category = category, productType = productType,
    stock = stock, imageUrl = imageUrl, active = active,
    createdAt = "", updatedAt = ""
)
