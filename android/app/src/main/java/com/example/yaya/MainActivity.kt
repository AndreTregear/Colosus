package com.example.yaya

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.yaya.ui.AuthState
import com.example.yaya.ui.MainViewModel
import com.example.yaya.ui.navigation.AuthNavGraph
import com.example.yaya.ui.navigation.MainNavGraph
import com.example.yaya.ui.navigation.OnboardingNavGraph
import com.example.yaya.ui.theme.YayaTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint(androidx.activity.ComponentActivity::class)
class MainActivity : Hilt_MainActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            YayaTheme {
                val viewModel: MainViewModel = hiltViewModel()
                val authState by viewModel.authState.collectAsState()

                when (authState) {
                    AuthState.Loading -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                    AuthState.NeedsOnboarding -> {
                        OnboardingNavGraph(onOnboardingComplete = { viewModel.onOnboardingComplete() })
                    }
                    AuthState.Unauthenticated -> {
                        AuthNavGraph(onLoginSuccess = { viewModel.onLoginSuccess() })
                    }
                    AuthState.Authenticated -> {
                        MainNavGraph(onLogout = { viewModel.onLogout() })
                    }
                }
            }
        }
    }
}
