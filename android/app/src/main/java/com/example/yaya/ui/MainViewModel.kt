package com.example.yaya.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.local.datastore.SubscriptionPreferences
import com.example.yaya.data.remote.AuthEvent
import com.example.yaya.data.remote.AuthEventBus
import com.example.yaya.data.repository.PlatformSubscriptionRepository
import com.example.yaya.security.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class AuthState { Loading, NeedsOnboarding, Authenticated, Unauthenticated }

@HiltViewModel
class MainViewModel @Inject constructor(
    private val tokenManager: TokenManager,
    private val authEventBus: AuthEventBus,
    private val platformSubscriptionRepository: PlatformSubscriptionRepository,
    private val appConfigPreferences: AppConfigPreferences,
    private val subscriptionPreferences: SubscriptionPreferences
) : ViewModel() {

    private val _authState = MutableStateFlow(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        // Check onboarding → token → auth state
        viewModelScope.launch {
            val onboardingDone = appConfigPreferences.onboardingCompleted.first()
            if (!onboardingDone) {
                _authState.value = AuthState.NeedsOnboarding
            } else if (tokenManager.getToken() != null && !tokenManager.isTokenExpired()) {
                refreshSubscriptionStatus()
                _authState.value = AuthState.Authenticated
            } else {
                _authState.value = AuthState.Unauthenticated
            }
        }

        // Listen for force-logout
        viewModelScope.launch {
            authEventBus.events.collect { event ->
                when (event) {
                    AuthEvent.ForceLogout -> _authState.value = AuthState.Unauthenticated
                }
            }
        }
    }

    private suspend fun refreshSubscriptionStatus() {
        try {
            platformSubscriptionRepository.getSubscriptionStatus()
                .onSuccess { sub ->
                    subscriptionPreferences.setPlanSlug(sub.planSlug)
                    subscriptionPreferences.setPlanName(sub.planName)
                    subscriptionPreferences.setCanSendMessages(sub.canSendMessages)
                    subscriptionPreferences.setMessagesUsed(sub.messagesUsed)
                    subscriptionPreferences.setMessagesLimit(sub.messagesLimit)
                    subscriptionPreferences.setPaidPlan(sub.isPaid)
                }
        } catch (e: Exception) {
            Log.w("MainViewModel", "Failed to refresh subscription status", e)
        }
    }

    fun onOnboardingComplete() {
        // After onboarding, check if user has a token (they may have registered during onboarding)
        viewModelScope.launch {
            _authState.value = if (tokenManager.getToken() != null && !tokenManager.isTokenExpired()) {
                refreshSubscriptionStatus()
                AuthState.Authenticated
            } else {
                AuthState.Unauthenticated // No valid token — route to login
            }
        }
    }

    fun onLoginSuccess() {
        _authState.value = AuthState.Authenticated
    }

    fun onLogout() {
        _authState.value = AuthState.Unauthenticated
    }
}
