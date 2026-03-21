package com.example.yaya.di

import android.content.Context
import com.example.yaya.data.local.datastore.AuthPreferences
import com.example.yaya.data.local.datastore.SubscriptionPreferences
import com.example.yaya.data.local.db.AgentMessageDao
import com.example.yaya.data.local.db.CustomerDao
import com.example.yaya.data.local.db.OrderDao
import com.example.yaya.data.local.db.PaymentDao
import com.example.yaya.data.local.db.ProductDao
import com.example.yaya.data.remote.api.YayaApiService
import com.example.yaya.data.repository.*
import com.example.yaya.security.TokenManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: YayaApiService,
        tokenManager: TokenManager,
        authPreferences: AuthPreferences,
        subscriptionPreferences: SubscriptionPreferences
    ): AuthRepository {
        return AuthRepository(apiService, tokenManager, authPreferences, subscriptionPreferences)
    }

    @Provides
    @Singleton
    fun providePaymentRepository(
        paymentDao: PaymentDao,
        apiService: YayaApiService
    ): PaymentRepository {
        return PaymentRepository(paymentDao, apiService)
    }

    @Provides
    @Singleton
    fun provideOrderRepository(
        apiService: YayaApiService,
        orderDao: OrderDao
    ): OrderRepository {
        return OrderRepository(apiService, orderDao)
    }

    @Provides
    @Singleton
    fun provideSubscriptionRepository(
        apiService: YayaApiService
    ): SubscriptionRepository {
        return SubscriptionRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideProductRepository(
        apiService: YayaApiService,
        productDao: ProductDao,
        @ApplicationContext context: Context
    ): ProductRepository {
        return ProductRepository(apiService, productDao, context)
    }

    @Provides
    @Singleton
    fun provideCustomerRepository(
        apiService: YayaApiService,
        customerDao: CustomerDao
    ): CustomerRepository {
        return CustomerRepository(apiService, customerDao)
    }

    @Provides
    @Singleton
    fun provideDashboardRepository(
        apiService: YayaApiService
    ): DashboardRepository {
        return DashboardRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideSettingsRepository(
        apiService: YayaApiService
    ): SettingsRepository {
        return SettingsRepository(apiService)
    }

    @Provides
    @Singleton
    fun providePlatformSubscriptionRepository(
        apiService: YayaApiService
    ): PlatformSubscriptionRepository {
        return PlatformSubscriptionRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideWhatsAppRepository(
        apiService: YayaApiService
    ): WhatsAppRepository {
        return WhatsAppRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideConversationRepository(
        apiService: YayaApiService
    ): ConversationRepository {
        return ConversationRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideProductExtractionRepository(
        apiService: YayaApiService
    ): ProductExtractionRepository {
        return ProductExtractionRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideNotificationSettingsRepository(
        apiService: YayaApiService
    ): NotificationSettingsRepository {
        return NotificationSettingsRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideCalendarRepository(
        apiService: YayaApiService
    ): CalendarRepository {
        return CalendarRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideFollowUpFlowRepository(
        apiService: YayaApiService
    ): FollowUpFlowRepository {
        return FollowUpFlowRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideAgentRepository(
        apiService: YayaApiService,
        agentMessageDao: AgentMessageDao
    ): AgentRepository {
        return AgentRepository(apiService, agentMessageDao)
    }

    @Provides
    @Singleton
    fun provideAnalyticsRepository(
        apiService: YayaApiService
    ): AnalyticsRepository {
        return AnalyticsRepository(apiService)
    }
}
