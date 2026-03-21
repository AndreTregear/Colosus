package com.example.yaya.data.local.datastore

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppConfigPreferences @Inject constructor(
    @ApplicationContext context: Context
) {
    private val dataStore = context.yayaDataStore

    val backendUrl: Flow<String> = dataStore.data.map { it[Keys.BACKEND_URL] ?: "" }
    val deviceId: Flow<String> = dataStore.data.map { it[Keys.DEVICE_ID] ?: "" }
    val onboardingCompleted: Flow<Boolean> = dataStore.data.map { it[Keys.ONBOARDING_COMPLETED] ?: false }

    suspend fun setBackendUrl(url: String) { dataStore.edit { it[Keys.BACKEND_URL] = url } }
    suspend fun setDeviceId(id: String) { dataStore.edit { it[Keys.DEVICE_ID] = id } }
    suspend fun setOnboardingCompleted(completed: Boolean) { dataStore.edit { it[Keys.ONBOARDING_COMPLETED] = completed } }

    private object Keys {
        val BACKEND_URL = stringPreferencesKey("backend_url")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    }
}
