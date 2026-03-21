package com.example.yaya.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.yaya.data.model.Payment
import com.example.yaya.data.model.PaymentStatus
import com.example.yaya.data.model.SyncStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface PaymentDao {

    @Query("SELECT * FROM payments ORDER BY capturedAt DESC")
    fun getAllPayments(): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE paymentStatus = :status ORDER BY capturedAt DESC")
    fun getByStatus(status: PaymentStatus): Flow<List<Payment>>

    @Query(
        """SELECT * FROM payments
        WHERE capturedAt >= :startOfDay
        ORDER BY capturedAt DESC"""
    )
    fun getTodayPayments(startOfDay: Long): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE syncStatus = :status")
    suspend fun getUnsynced(status: SyncStatus = SyncStatus.UNSYNCED): List<Payment>

    @Query(
        """SELECT COUNT(*) FROM payments
        WHERE notificationHash = :hash AND capturedAt >= :since"""
    )
    suspend fun countByHashSince(hash: String, since: Long): Int

    @Query(
        """SELECT COUNT(*) FROM payments
        WHERE senderName = :senderName AND amount = :amount AND capturedAt >= :since"""
    )
    suspend fun countBySenderAndAmountSince(senderName: String, amount: Double, since: Long): Int

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insert(payment: Payment): Long

    @Update
    suspend fun update(payment: Payment)

    @Query(
        """UPDATE payments
        SET syncStatus = :syncStatus, syncedAt = :syncedAt, backendId = :backendId
        WHERE id = :id"""
    )
    suspend fun markSynced(
        id: Long,
        syncStatus: SyncStatus = SyncStatus.SYNCED,
        syncedAt: Long = System.currentTimeMillis(),
        backendId: String? = null
    )

    @Query("SELECT COALESCE(SUM(amount), 0.0) FROM payments WHERE capturedAt >= :startOfDay")
    fun getTodayTotal(startOfDay: Long): Flow<Double>

    @Query("SELECT COUNT(*) FROM payments WHERE capturedAt >= :startOfDay")
    fun getTodayCount(startOfDay: Long): Flow<Int>
}
