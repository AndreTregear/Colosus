package com.example.yaya.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "payments",
    indices = [
        Index(value = ["notificationHash"]),
        Index(value = ["senderName", "amount", "capturedAt"])
    ]
)
data class Payment(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val senderName: String,
    val amount: Double,
    val rawNotification: String,
    val notificationHash: String,
    val capturedAt: Long = System.currentTimeMillis(),
    val paymentStatus: PaymentStatus = PaymentStatus.PENDING,
    val syncStatus: SyncStatus = SyncStatus.UNSYNCED,
    val syncedAt: Long? = null,
    val backendId: String? = null,
    val retryCount: Int = 0
)
