package com.example.yaya.ui.screens.extraction

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.ExtractedProduct
import com.example.yaya.data.repository.ProductExtractionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class ChatMessage(
    val text: String,
    val isUser: Boolean,
    val products: List<ExtractedProduct>? = null
)

data class ExtractionUiState(
    val messages: List<ChatMessage> = emptyList(),
    val inputText: String = "",
    val sessionId: String? = null,
    val extractedProducts: List<ExtractedProduct> = emptyList(),
    val isLoading: Boolean = false,
    val isRecording: Boolean = false,
    val error: String? = null,
    val showProductPreview: Boolean = false,
    val savedCount: Int = 0,
    val isSaved: Boolean = false
)

@HiltViewModel
class ProductExtractionViewModel @Inject constructor(
    private val extractionRepository: ProductExtractionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ExtractionUiState())
    val uiState: StateFlow<ExtractionUiState> = _uiState.asStateFlow()

    private val _savedEvent = MutableSharedFlow<Int>()
    val savedEvent: SharedFlow<Int> = _savedEvent.asSharedFlow()

    fun updateInput(text: String) {
        _uiState.update { it.copy(inputText = text) }
    }

    fun sendText() {
        val text = _uiState.value.inputText.trim()
        if (text.isBlank()) return

        _uiState.update {
            it.copy(
                messages = it.messages + ChatMessage(text, isUser = true),
                inputText = "",
                isLoading = true,
                error = null
            )
        }

        viewModelScope.launch {
            val result = extractionRepository.extractFromText(
                text = text,
                sessionId = _uiState.value.sessionId
            )
            handleExtractionResult(result)
        }
    }

    fun sendVoice(audioFile: File) {
        _uiState.update {
            it.copy(
                messages = it.messages + ChatMessage("Mensaje de voz enviado", isUser = true),
                isLoading = true,
                error = null
            )
        }

        viewModelScope.launch {
            val result = extractionRepository.extractFromVoice(
                audioFile = audioFile,
                sessionId = _uiState.value.sessionId
            )
            handleExtractionResult(result)
        }
    }

    fun sendPhoto(imageFile: File, description: String? = null) {
        _uiState.update {
            it.copy(
                messages = it.messages + ChatMessage("Foto enviada", isUser = true),
                isLoading = true,
                error = null
            )
        }

        viewModelScope.launch {
            val result = extractionRepository.extractFromPhoto(
                imageFile = imageFile,
                description = description
            )
            handleExtractionResult(result)
        }
    }

    private fun handleExtractionResult(result: Result<com.example.yaya.data.remote.dto.ExtractionResponse>) {
        result.fold(
            onSuccess = { response ->
                val messageText = when (response.status) {
                    "needs_clarification" -> response.clarifyingQuestion ?: "Necesito mas detalles..."
                    "complete" -> {
                        if (response.createdCount != null) {
                            "${response.createdCount} productos guardados exitosamente"
                        } else {
                            buildString {
                                append("Encontre ${response.products?.size ?: 0} producto(s):")
                                response.products?.forEach { p ->
                                    append("\n  - ${p.name} — S/ ${"%.2f".format(p.price)}")
                                }
                            }
                        }
                    }
                    else -> "Respuesta recibida"
                }

                _uiState.update {
                    it.copy(
                        messages = it.messages + ChatMessage(
                            text = messageText,
                            isUser = false,
                            products = response.products
                        ),
                        sessionId = response.sessionId ?: it.sessionId,
                        extractedProducts = response.products ?: it.extractedProducts,
                        showProductPreview = response.status == "complete" && response.createdCount == null && !response.products.isNullOrEmpty(),
                        isLoading = false,
                        isSaved = response.createdCount != null && response.createdCount > 0,
                        savedCount = response.createdCount ?: it.savedCount
                    )
                }

                if (response.createdCount != null && response.createdCount > 0) {
                    viewModelScope.launch {
                        _savedEvent.emit(response.createdCount)
                    }
                }
            },
            onFailure = { error ->
                Log.e("ProductExtraction", "Extraction failed", error)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Error al procesar"
                    )
                }
            }
        )
    }

    fun confirmProducts(selected: List<ExtractedProduct>) {
        val sessionId = _uiState.value.sessionId ?: return
        _uiState.update { it.copy(isLoading = true, showProductPreview = false) }

        viewModelScope.launch {
            val result = extractionRepository.confirmProducts(sessionId, selected)
            handleExtractionResult(result)
        }
    }

    fun dismissPreview() {
        _uiState.update { it.copy(showProductPreview = false) }
    }

    fun resetConversation() {
        _uiState.value = ExtractionUiState()
    }
}
