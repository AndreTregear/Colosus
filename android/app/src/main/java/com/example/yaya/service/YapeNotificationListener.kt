package com.example.yaya.service

import android.app.Notification
import android.service.notification.StatusBarNotification
import android.util.Log
import com.example.yaya.BuildConfig
import com.example.yaya.data.local.db.PaymentDao
import com.example.yaya.data.model.Payment
import com.example.yaya.worker.SyncScheduler
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint(android.service.notification.NotificationListenerService::class)
class YapeNotificationListener : Hilt_YapeNotificationListener() {

    @Inject lateinit var paymentDao: PaymentDao
    @Inject lateinit var deduplicationManager: DeduplicationManager
    @Inject lateinit var syncScheduler: SyncScheduler

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return
        if (sbn.packageName != YAPE_PACKAGE) return

        val extras = sbn.notification.extras ?: return
        val text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
            ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            ?: return

        if (BuildConfig.DEBUG) Log.d(TAG, "Yape notification received")

        val parsed = NotificationParser.parse(text)
        if (parsed == null) {
            if (BuildConfig.DEBUG) Log.d(TAG, "Could not parse notification")
            return
        }

        // Reject unreasonable amounts (max S/ 500,000)
        if (parsed.amount > 500_000.0) {
            if (BuildConfig.DEBUG) Log.w(TAG, "Rejecting notification with excessive amount")
            return
        }

        serviceScope.launch {
            try {
                if (deduplicationManager.isDuplicate(parsed.rawText)) {
                    if (BuildConfig.DEBUG) Log.d(TAG, "Duplicate notification (hash match), skipping")
                    return@launch
                }

                if (deduplicationManager.isDuplicatePayment(parsed.senderName, parsed.amount)) {
                    if (BuildConfig.DEBUG) Log.d(TAG, "Duplicate notification (sender+amount match), skipping")
                    return@launch
                }

                val hash = deduplicationManager.computeHash(parsed.rawText)
                val payment = Payment(
                    senderName = parsed.senderName.take(200),
                    amount = parsed.amount,
                    rawNotification = parsed.rawText.take(500),
                    notificationHash = hash
                )

                val id = paymentDao.insert(payment)
                if (BuildConfig.DEBUG) Log.d(TAG, "Payment saved: id=$id")

                syncScheduler.scheduleImmediateSync()
            } catch (e: Exception) {
                Log.e(TAG, "Error processing notification", e)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    companion object {
        private const val TAG = "YapeNotificationListener"
        private const val YAPE_PACKAGE = "com.bcp.innovacxion.yapeapp"
    }
}
