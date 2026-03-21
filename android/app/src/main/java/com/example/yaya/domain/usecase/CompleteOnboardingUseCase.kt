package com.example.yaya.domain.usecase

import android.util.Log
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.repository.SettingsRepository
import javax.inject.Inject

class CompleteOnboardingUseCase @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val appConfigPreferences: AppConfigPreferences,
    private val authPreferences: AuthPreferences
) {
    suspend operator fun invoke(
        businessType: String,
        businessName: String,
        address: String,
        yapeNumber: String
    ) {
        // Save settings to backend (best-effort)
        try {
            settingsRepository.updateSetting("business_type", businessType)
            if (address.isNotBlank()) {
                settingsRepository.updateSetting("address", address)
            }
            if (yapeNumber.isNotBlank()) {
                settingsRepository.updateSetting("yape_number", yapeNumber)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving settings to backend", e)
        }

        // Mark onboarding complete locally
        appConfigPreferences.setOnboardingCompleted(true)
        authPreferences.setBusinessName(businessName)
    }

    companion object {
        private const val TAG = "CompleteOnboardingUC"
    }
}
