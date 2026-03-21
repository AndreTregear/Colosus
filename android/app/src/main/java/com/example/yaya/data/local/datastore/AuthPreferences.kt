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
class AuthPreferences @Inject constructor(
    @ApplicationContext context: Context
) {
    private val dataStore = context.yayaDataStore

    val isLoggedIn: Flow<Boolean> = dataStore.data.map { it[Keys.IS_LOGGED_IN] ?: false }
    val tenantId: Flow<String> = dataStore.data.map { it[Keys.TENANT_ID] ?: "" }
    val tenantName: Flow<String> = dataStore.data.map { it[Keys.TENANT_NAME] ?: "" }
    val userId: Flow<String> = dataStore.data.map { it[Keys.USER_ID] ?: "" }
    val userName: Flow<String> = dataStore.data.map { it[Keys.USER_NAME] ?: "" }
    val phoneNumber: Flow<String> = dataStore.data.map { it[Keys.PHONE_NUMBER] ?: "" }
    val apiKey: Flow<String> = dataStore.data.map { it[Keys.API_KEY] ?: "" }
    val businessName: Flow<String> = tenantName

    suspend fun setLoggedIn(loggedIn: Boolean) { dataStore.edit { it[Keys.IS_LOGGED_IN] = loggedIn } }
    suspend fun setTenantId(id: String) { dataStore.edit { it[Keys.TENANT_ID] = id } }
    suspend fun setTenantName(name: String) { dataStore.edit { it[Keys.TENANT_NAME] = name } }
    suspend fun setUserId(id: String) { dataStore.edit { it[Keys.USER_ID] = id } }
    suspend fun setUserName(name: String) { dataStore.edit { it[Keys.USER_NAME] = name } }
    suspend fun setPhoneNumber(phone: String) { dataStore.edit { it[Keys.PHONE_NUMBER] = phone } }
    suspend fun setApiKey(key: String) { dataStore.edit { it[Keys.API_KEY] = key } }
    suspend fun setBusinessName(name: String) { dataStore.edit { it[Keys.TENANT_NAME] = name } }

    suspend fun clearAll() { dataStore.edit { it.clear() } }

    private object Keys {
        val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val TENANT_ID = stringPreferencesKey("tenant_id")
        val TENANT_NAME = stringPreferencesKey("tenant_name")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_NAME = stringPreferencesKey("user_name")
        val PHONE_NUMBER = stringPreferencesKey("phone_number")
        val API_KEY = stringPreferencesKey("api_key")
    }
}
