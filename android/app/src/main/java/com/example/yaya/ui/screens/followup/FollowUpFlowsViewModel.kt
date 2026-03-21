package com.example.yaya.ui.screens.followup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.remote.dto.FollowUpFlowDto
import com.example.yaya.data.repository.FollowUpFlowRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FollowUpFlowsUiState(
    val flows: List<FollowUpFlowDto> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val togglingType: String? = null
)

@HiltViewModel
class FollowUpFlowsViewModel @Inject constructor(
    private val repository: FollowUpFlowRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FollowUpFlowsUiState())
    val uiState: StateFlow<FollowUpFlowsUiState> = _uiState.asStateFlow()

    init {
        loadFlows()
    }

    fun loadFlows() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getFlows().fold(
                onSuccess = { flows ->
                    _uiState.update { it.copy(flows = flows, isLoading = false) }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, error = error.message) }
                }
            )
        }
    }

    fun toggleFlow(type: String, enabled: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(togglingType = type) }
            repository.toggleFlow(type, enabled).fold(
                onSuccess = {
                    _uiState.update { state ->
                        state.copy(
                            flows = state.flows.map { flow ->
                                if (flow.type == type) flow.copy(enabled = enabled) else flow
                            },
                            togglingType = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(togglingType = null, error = error.message) }
                }
            )
        }
    }

    fun toggleAll(enabled: Boolean) {
        viewModelScope.launch {
            _uiState.update { it.copy(togglingType = "all") }
            val flows = _uiState.value.flows
            var allSucceeded = true
            for (flow in flows) {
                if (flow.enabled != enabled) {
                    repository.toggleFlow(flow.type, enabled).fold(
                        onSuccess = {
                            _uiState.update { state ->
                                state.copy(
                                    flows = state.flows.map { f ->
                                        if (f.type == flow.type) f.copy(enabled = enabled) else f
                                    }
                                )
                            }
                        },
                        onFailure = { allSucceeded = false }
                    )
                }
            }
            _uiState.update {
                it.copy(
                    togglingType = null,
                    error = if (!allSucceeded) "Algunos flujos no se pudieron actualizar" else null
                )
            }
        }
    }
}
