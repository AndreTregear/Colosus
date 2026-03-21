package com.example.yaya.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.sqrt

object ImageCompressor {

    private const val MAX_DIMENSION = 1920
    private const val MAX_BYTES = 1_048_576 // 1 MB
    private const val JPEG_QUALITY = 80
    private val ALLOWED_MIME_TYPES = setOf("image/jpeg", "image/png", "image/webp")

    fun validateMimeType(mimeType: String?): Boolean {
        return mimeType in ALLOWED_MIME_TYPES
    }

    fun compressIfNeeded(context: Context, imageUri: Uri): ByteArray? {
        val contentResolver = context.contentResolver
        val inputStream = contentResolver.openInputStream(imageUri) ?: return null
        val originalBytes = inputStream.readBytes()
        inputStream.close()

        // If already under size limit, return as-is
        if (originalBytes.size <= MAX_BYTES) return originalBytes

        // Decode, resize, and re-encode
        val bitmap = BitmapFactory.decodeByteArray(originalBytes, 0, originalBytes.size)
            ?: return originalBytes
        val resized = resizeIfNeeded(bitmap)
        val output = ByteArrayOutputStream()
        resized.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, output)

        if (resized != bitmap) resized.recycle()
        bitmap.recycle()

        return output.toByteArray()
    }

    private fun resizeIfNeeded(bitmap: Bitmap): Bitmap {
        val longestEdge = max(bitmap.width, bitmap.height)
        if (longestEdge <= MAX_DIMENSION) return bitmap

        val scale = MAX_DIMENSION.toFloat() / longestEdge
        val newWidth = (bitmap.width * scale).toInt()
        val newHeight = (bitmap.height * scale).toInt()
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
}
