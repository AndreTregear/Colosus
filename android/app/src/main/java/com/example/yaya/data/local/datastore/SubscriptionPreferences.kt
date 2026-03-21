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
class SubscriptionPreferences @Inject constructor(
    @ApplicationContext context: Context
) {
    private val dataStore = context.yayaDataStore

    val planSlug: Flow<String> = dataStore.data.map { it[Keys.PLAN_SLUG] ?: "free" }
    val planName: Flow<String> = dataStore.data.map { it[Keys.PLAN_NAME] ?: "Gratis" }
    val canSendMessages: Flow<Boolean> = dataStore.data.map { it[Keys.CAN_SEND_MESSAGES] ?: true }
    val messagesUsed: Flow<Int> = dataStore.data.map { (it[Keys.MESSAGES_USED] ?: "0").toIntOrNull() ?: 0 }
    val messagesLimit: Flow<Int> = dataStore.data.map { (it[Keys.MESSAGES_LIMIT] ?: "100").toIntOrNull() ?: 100 }
    val isPaidPlan: Flow<Boolean> = dataStore.data.map { it[Keys.IS_PAID_PLAN] ?: false }

    suspend fun setPlanSlug(slug: String) { dataStore.edit { it[Keys.PLAN_SLUG] = slug } }
    suspend fun setPlanName(name: String) { dataStore.edit { it[Keys.PLAN_NAME] = name } }
    suspend fun setCanSendMessages(can: Boolean) { dataStore.edit { it[Keys.CAN_SEND_MESSAGES] = can } }
    suspend fun setMessagesUsed(count: Int) { dataStore.edit { it[Keys.MESSAGES_USED] = count.toString() } }
    suspend fun setMessagesLimit(limit: Int) { dataStore.edit { it[Keys.MESSAGES_LIMIT] = limit.toString() } }
    suspend fun setPaidPlan(paid: Boolean) { dataStore.edit { it[Keys.IS_PAID_PLAN] = paid } }

    private object Keys {
        val PLAN_SLUG = stringPreferencesKey("subscription_plan_slug")
        val PLAN_NAME = stringPreferencesKey("subscription_plan_name")
        val CAN_SEND_MESSAGES = booleanPreferencesKey("can_send_messages")
        val MESSAGES_USED = stringPreferencesKey("messages_used")
        val MESSAGES_LIMIT = stringPreferencesKey("messages_limit")
        val IS_PAID_PLAN = booleanPreferencesKey("is_paid_plan")
    }
}
