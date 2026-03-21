package com.example.yaya.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore

val Context.yayaDataStore: DataStore<Preferences> by preferencesDataStore(name = "yaya_preferences")
