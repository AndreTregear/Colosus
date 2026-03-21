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

/**
 * Legacy facade — prefer [AuthPreferences], [SubscriptionPreferences], or [AppConfigPreferences]
 * for new code. This class remains for backward compatibility during migration.
 */
@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.yayaDataStore

    // ── Auth state ──────────────────────────────

    val isLoggedIn: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.IS_LOGGED_IN] ?: false
    }

    val tenantId: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.TENANT_ID] ?: ""
    }

    val tenantName: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.TENANT_NAME] ?: ""
    }

    val userId: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.USER_ID] ?: ""
    }

    val userName: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.USER_NAME] ?: ""
    }

    val phoneNumber: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.PHONE_NUMBER] ?: ""
    }

    val apiKey: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.API_KEY] ?: ""
    }

    // ── Subscription state ─────────────────────

    val subscriptionPlanSlug: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.SUBSCRIPTION_PLAN_SLUG] ?: "free"
    }

    val subscriptionPlanName: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.SUBSCRIPTION_PLAN_NAME] ?: "Gratis"
    }

    val canSendMessages: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.CAN_SEND_MESSAGES] ?: true
    }

    val messagesUsed: Flow<Int> = dataStore.data.map { prefs ->
        (prefs[Keys.MESSAGES_USED] ?: "0").toIntOrNull() ?: 0
    }

    val messagesLimit: Flow<Int> = dataStore.data.map { prefs ->
        (prefs[Keys.MESSAGES_LIMIT] ?: "100").toIntOrNull() ?: 100
    }

    val isPaidPlan: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.IS_PAID_PLAN] ?: false
    }

    // ── Legacy compatibility ────────────────────

    val isRegistered: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.IS_REGISTERED] ?: false
    }

    val businessName: Flow<String> = tenantName

    val businessId: Flow<String> = tenantId

    val deviceId: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.DEVICE_ID] ?: ""
    }

    val backendUrl: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.BACKEND_URL] ?: ""
    }

    val onboardingCompleted: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.ONBOARDING_COMPLETED] ?: false
    }

    // ── Setters ─────────────────────────────────

    suspend fun setLoggedIn(loggedIn: Boolean) {
        dataStore.edit { it[Keys.IS_LOGGED_IN] = loggedIn }
    }

    suspend fun setTenantId(id: String) {
        dataStore.edit { it[Keys.TENANT_ID] = id }
    }

    suspend fun setTenantName(name: String) {
        dataStore.edit { it[Keys.TENANT_NAME] = name }
    }

    suspend fun setUserId(id: String) {
        dataStore.edit { it[Keys.USER_ID] = id }
    }

    suspend fun setUserName(name: String) {
        dataStore.edit { it[Keys.USER_NAME] = name }
    }

    suspend fun setPhoneNumber(phone: String) {
        dataStore.edit { it[Keys.PHONE_NUMBER] = phone }
    }

    suspend fun setApiKey(key: String) {
        dataStore.edit { it[Keys.API_KEY] = key }
    }

    suspend fun setRegistered(registered: Boolean) {
        dataStore.edit { it[Keys.IS_REGISTERED] = registered }
    }

    suspend fun setBusinessName(name: String) {
        dataStore.edit { it[Keys.TENANT_NAME] = name }
    }

    suspend fun setBusinessId(id: String) {
        dataStore.edit { it[Keys.TENANT_ID] = id }
    }

    suspend fun setDeviceId(id: String) {
        dataStore.edit { it[Keys.DEVICE_ID] = id }
    }

    suspend fun setBackendUrl(url: String) {
        dataStore.edit { it[Keys.BACKEND_URL] = url }
    }

    suspend fun setOnboardingCompleted(completed: Boolean) {
        dataStore.edit { it[Keys.ONBOARDING_COMPLETED] = completed }
    }

    suspend fun setSubscriptionPlanSlug(slug: String) {
        dataStore.edit { it[Keys.SUBSCRIPTION_PLAN_SLUG] = slug }
    }

    suspend fun setSubscriptionPlanName(name: String) {
        dataStore.edit { it[Keys.SUBSCRIPTION_PLAN_NAME] = name }
    }

    suspend fun setCanSendMessages(can: Boolean) {
        dataStore.edit { it[Keys.CAN_SEND_MESSAGES] = can }
    }

    suspend fun setMessagesUsed(count: Int) {
        dataStore.edit { it[Keys.MESSAGES_USED] = count.toString() }
    }

    suspend fun setMessagesLimit(limit: Int) {
        dataStore.edit { it[Keys.MESSAGES_LIMIT] = limit.toString() }
    }

    suspend fun setPaidPlan(paid: Boolean) {
        dataStore.edit { it[Keys.IS_PAID_PLAN] = paid }
    }

    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }

    private object Keys {
        val IS_LOGGED_IN = booleanPreferencesKey("is_logged_in")
        val TENANT_ID = stringPreferencesKey("tenant_id")
        val TENANT_NAME = stringPreferencesKey("tenant_name")
        val USER_ID = stringPreferencesKey("user_id")
        val USER_NAME = stringPreferencesKey("user_name")
        val PHONE_NUMBER = stringPreferencesKey("phone_number")
        val API_KEY = stringPreferencesKey("api_key")
        // Subscription keys
        val SUBSCRIPTION_PLAN_SLUG = stringPreferencesKey("subscription_plan_slug")
        val SUBSCRIPTION_PLAN_NAME = stringPreferencesKey("subscription_plan_name")
        val CAN_SEND_MESSAGES = booleanPreferencesKey("can_send_messages")
        val MESSAGES_USED = stringPreferencesKey("messages_used")
        val MESSAGES_LIMIT = stringPreferencesKey("messages_limit")
        val IS_PAID_PLAN = booleanPreferencesKey("is_paid_plan")
        // Legacy keys
        val IS_REGISTERED = booleanPreferencesKey("is_registered")
        val BUSINESS_NAME = stringPreferencesKey("business_name")
        val BUSINESS_ID = stringPreferencesKey("business_id")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val BACKEND_URL = stringPreferencesKey("backend_url")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    }
}
