package com.example.yaya.di

import android.content.Context
import androidx.room.Room
import com.example.yaya.data.local.db.AgentMessageDao
import com.example.yaya.data.local.db.CustomerDao
import com.example.yaya.data.local.db.OrderDao
import com.example.yaya.data.local.db.PaymentDao
import com.example.yaya.data.local.db.ProductDao
import com.example.yaya.data.local.db.YayaDatabase
import com.example.yaya.data.remote.AuthEventBus
import com.example.yaya.security.TokenManager
import com.example.yaya.service.DeduplicationManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): YayaDatabase {
        return Room.databaseBuilder(
            context,
            YayaDatabase::class.java,
            "yaya_database"
        )
            .addMigrations(YayaDatabase.MIGRATION_1_2, YayaDatabase.MIGRATION_2_3, YayaDatabase.MIGRATION_3_4)
            .build()
    }

    @Provides
    @Singleton
    fun providePaymentDao(database: YayaDatabase): PaymentDao {
        return database.paymentDao()
    }

    @Provides
    @Singleton
    fun provideProductDao(database: YayaDatabase): ProductDao {
        return database.productDao()
    }

    @Provides
    @Singleton
    fun provideOrderDao(database: YayaDatabase): OrderDao {
        return database.orderDao()
    }

    @Provides
    @Singleton
    fun provideCustomerDao(database: YayaDatabase): CustomerDao {
        return database.customerDao()
    }

    @Provides
    @Singleton
    fun provideAgentMessageDao(database: YayaDatabase): AgentMessageDao {
        return database.agentMessageDao()
    }

    @Provides
    @Singleton
    fun provideTokenManager(@ApplicationContext context: Context): TokenManager {
        return TokenManager(context)
    }

    @Provides
    @Singleton
    fun provideDeduplicationManager(paymentDao: PaymentDao): DeduplicationManager {
        return DeduplicationManager(paymentDao)
    }

    @Provides
    @Singleton
    fun provideAuthEventBus(): AuthEventBus {
        return AuthEventBus()
    }
}
