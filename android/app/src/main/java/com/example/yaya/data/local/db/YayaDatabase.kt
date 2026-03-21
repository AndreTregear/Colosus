package com.example.yaya.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.yaya.data.model.AgentMessageEntity
import com.example.yaya.data.model.CustomerEntity
import com.example.yaya.data.model.OrderEntity
import com.example.yaya.data.model.Payment
import com.example.yaya.data.model.ProductEntity

@Database(
    entities = [
        Payment::class,
        ProductEntity::class,
        OrderEntity::class,
        CustomerEntity::class,
        AgentMessageEntity::class
    ],
    version = 4,
    exportSchema = true
)
abstract class YayaDatabase : RoomDatabase() {
    abstract fun paymentDao(): PaymentDao
    abstract fun productDao(): ProductDao
    abstract fun orderDao(): OrderDao
    abstract fun customerDao(): CustomerDao
    abstract fun agentMessageDao(): AgentMessageDao

    companion object {
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE INDEX IF NOT EXISTS `index_payments_senderName_amount_capturedAt` " +
                        "ON `payments` (`senderName`, `amount`, `capturedAt`)"
                )
            }
        }

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `products` (" +
                        "`id` INTEGER NOT NULL, " +
                        "`name` TEXT NOT NULL, " +
                        "`description` TEXT NOT NULL, " +
                        "`price` REAL NOT NULL, " +
                        "`category` TEXT NOT NULL, " +
                        "`productType` TEXT NOT NULL, " +
                        "`stock` INTEGER, " +
                        "`imageUrl` TEXT, " +
                        "`active` INTEGER NOT NULL, " +
                        "`cachedAt` INTEGER NOT NULL, " +
                        "PRIMARY KEY(`id`))"
                )
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `orders` (" +
                        "`id` INTEGER NOT NULL, " +
                        "`customerId` INTEGER NOT NULL, " +
                        "`status` TEXT NOT NULL, " +
                        "`total` REAL NOT NULL, " +
                        "`deliveryType` TEXT NOT NULL, " +
                        "`deliveryAddress` TEXT, " +
                        "`notes` TEXT, " +
                        "`createdAt` TEXT NOT NULL, " +
                        "`updatedAt` TEXT NOT NULL, " +
                        "`cachedAt` INTEGER NOT NULL, " +
                        "PRIMARY KEY(`id`))"
                )
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `customers` (" +
                        "`id` INTEGER NOT NULL, " +
                        "`channel` TEXT NOT NULL, " +
                        "`jid` TEXT NOT NULL, " +
                        "`name` TEXT, " +
                        "`phone` TEXT, " +
                        "`location` TEXT, " +
                        "`address` TEXT, " +
                        "`notes` TEXT, " +
                        "`cachedAt` INTEGER NOT NULL, " +
                        "PRIMARY KEY(`id`))"
                )
            }
        }

        val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `agent_messages` (" +
                        "`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
                        "`remoteId` TEXT, " +
                        "`role` TEXT NOT NULL, " +
                        "`content` TEXT NOT NULL, " +
                        "`contentType` TEXT NOT NULL DEFAULT 'text', " +
                        "`dataJson` TEXT, " +
                        "`timestamp` INTEGER NOT NULL)"
                )
            }
        }
    }
}
