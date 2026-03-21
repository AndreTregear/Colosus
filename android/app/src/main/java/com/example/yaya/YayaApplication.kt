package com.example.yaya

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.work.Configuration
import com.example.yaya.data.local.datastore.AppConfigPreferences
import com.example.yaya.data.remote.NetworkMonitor
import com.example.yaya.data.remote.SseClient
import com.example.yaya.data.remote.interceptor.BaseUrlInterceptor
import com.example.yaya.service.AppNotificationManager
import com.example.yaya.worker.SyncScheduler
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp(Application::class)
class YayaApplication : Hilt_YayaApplication(), Configuration.Provider {

    @Inject lateinit var workerFactory: HiltWorkerFactory
    @Inject lateinit var syncScheduler: SyncScheduler
    @Inject lateinit var sseClient: SseClient
    @Inject lateinit var appNotificationManager: AppNotificationManager
    @Inject lateinit var networkMonitor: NetworkMonitor
    @Inject lateinit var baseUrlInterceptor: BaseUrlInterceptor
    @Inject lateinit var appConfigPreferences: AppConfigPreferences

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        syncScheduler.schedulePeriodicSync()
        networkMonitor.start()
        appNotificationManager.initialize()

        // Keep BaseUrlInterceptor cache in sync with DataStore
        appScope.launch {
            appConfigPreferences.backendUrl.collect { url ->
                baseUrlInterceptor.cachedBaseUrl = url
            }
        }

        // Connect/disconnect SSE based on app foreground/background state
        ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onStart(owner: LifecycleOwner) {
                networkMonitor.start()
                sseClient.connect()
            }

            override fun onStop(owner: LifecycleOwner) {
                sseClient.disconnect()
                networkMonitor.stop()
            }
        })
    }
}
