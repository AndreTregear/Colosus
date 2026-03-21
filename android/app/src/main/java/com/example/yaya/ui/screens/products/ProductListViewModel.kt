package com.example.yaya.ui.screens.products

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.remote.dto.ProductDto
import com.example.yaya.data.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductListUiState(
    val products: List<ProductDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = "",
    val backendUrl: String = ""
)

@HiltViewModel
class ProductListViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val appConfigPreferences: AppConfigPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProductListUiState())
    val uiState: StateFlow<ProductListUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    init {
        viewModelScope.launch {
            appConfigPreferences.backendUrl.collect { url ->
                _uiState.update { it.copy(backendUrl = url) }
            }
        }
        loadProducts()
    }

    fun buildImageUrl(relativePath: String): String {
        val base = _uiState.value.backendUrl.trimEnd('/')
        return "$base/media/$relativePath"
    }

    fun loadProducts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val query = _uiState.value.searchQuery.ifBlank { null }
            productRepository.getProducts(search = query).fold(
                onSuccess = { products ->
                    _uiState.update {
                        it.copy(products = products, isLoading = false)
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

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300)
            loadProducts()
        }
    }

    fun deleteProduct(id: Int) {
        viewModelScope.launch {
            productRepository.deleteProduct(id).fold(
                onSuccess = {
                    loadProducts()
                },
                onFailure = { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            )
        }
    }
}
