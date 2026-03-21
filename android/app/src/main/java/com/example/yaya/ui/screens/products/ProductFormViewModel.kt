package com.example.yaya.ui.screens.products

import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.remote.dto.CreateProductRequest
import com.example.yaya.data.remote.dto.UpdateProductRequest
import com.example.yaya.data.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductFormUiState(
    val name: String = "",
    val description: String = "",
    val price: String = "",
    val category: String = "general",
    val stock: String = "",
    val active: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isEditMode: Boolean = false,
    val imageUri: Uri? = null,
    val existingImageUrl: String? = null,
    val isUploading: Boolean = false,
    val backendUrl: String = ""
)

@HiltViewModel
class ProductFormViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val productRepository: ProductRepository,
    private val appConfigPreferences: AppConfigPreferences
) : ViewModel() {

    private val productId: Int? = savedStateHandle.get<Int>("productId")?.takeIf { it != -1 }

    private val _uiState = MutableStateFlow(ProductFormUiState(isEditMode = productId != null))
    val uiState: StateFlow<ProductFormUiState> = _uiState.asStateFlow()

    private val _saveSuccess = MutableSharedFlow<Unit>()
    val saveSuccess: SharedFlow<Unit> = _saveSuccess.asSharedFlow()

    init {
        viewModelScope.launch {
            appConfigPreferences.backendUrl.collect { url ->
                _uiState.update { it.copy(backendUrl = url) }
            }
        }
        if (productId != null) {
            loadProduct(productId)
        }
    }

    fun buildImageUrl(relativePath: String): String {
        val base = _uiState.value.backendUrl.trimEnd('/')
        return "$base/media/$relativePath"
    }

    private fun loadProduct(id: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            productRepository.getProductById(id).fold(
                onSuccess = { product ->
                    _uiState.update {
                        it.copy(
                            name = product.name,
                            description = product.description,
                            price = product.price.toString(),
                            category = product.category,
                            stock = product.stock?.toString() ?: "",
                            active = product.active,
                            existingImageUrl = product.imageUrl,
                            isLoading = false
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }

    fun onNameChange(value: String) {
        _uiState.update { it.copy(name = value, error = null) }
    }

    fun onDescriptionChange(value: String) {
        _uiState.update { it.copy(description = value, error = null) }
    }

    fun onPriceChange(value: String) {
        _uiState.update { it.copy(price = value, error = null) }
    }

    fun onCategoryChange(value: String) {
        _uiState.update { it.copy(category = value, error = null) }
    }

    fun onStockChange(value: String) {
        _uiState.update { it.copy(stock = value, error = null) }
    }

    fun onActiveChange(value: Boolean) {
        _uiState.update { it.copy(active = value, error = null) }
    }

    fun onImageCaptured(uri: Uri) {
        _uiState.update { it.copy(imageUri = uri, error = null) }
    }

    fun onImageRemoved() {
        _uiState.update { it.copy(imageUri = null, existingImageUrl = null, error = null) }
    }

    fun save() {
        val state = _uiState.value

        if (state.name.isBlank()) {
            _uiState.update { it.copy(error = "El nombre es obligatorio") }
            return
        }

        val priceValue = state.price.toDoubleOrNull()
        if (priceValue == null || priceValue <= 0) {
            _uiState.update { it.copy(error = "El precio debe ser mayor a 0") }
            return
        }

        val stockValue = state.stock.toIntOrNull()

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            // Upload image if a new one was captured
            var imageUrl = state.existingImageUrl
            if (state.imageUri != null) {
                _uiState.update { it.copy(isUploading = true) }
                val uploadResult = productRepository.uploadProductImage(state.imageUri)
                _uiState.update { it.copy(isUploading = false) }
                uploadResult.fold(
                    onSuccess = { url -> imageUrl = url },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(isLoading = false, error = "Error subiendo imagen: ${error.message}")
                        }
                        return@launch
                    }
                )
            }

            val result = if (productId != null) {
                productRepository.updateProduct(
                    id = productId,
                    request = UpdateProductRequest(
                        name = state.name,
                        description = state.description,
                        price = priceValue,
                        category = state.category.ifBlank { "general" },
                        stock = stockValue,
                        active = state.active,
                        imageUrl = imageUrl
                    )
                )
            } else {
                productRepository.createProduct(
                    request = CreateProductRequest(
                        name = state.name,
                        description = state.description,
                        price = priceValue,
                        category = state.category.ifBlank { "general" },
                        stock = stockValue,
                        active = state.active,
                        imageUrl = imageUrl
                    )
                )
            }

            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false) }
                    _saveSuccess.emit(Unit)
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(isLoading = false, error = error.message)
                    }
                }
            )
        }
    }
}
