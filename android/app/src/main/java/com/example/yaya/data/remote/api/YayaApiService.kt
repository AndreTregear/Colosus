package com.example.yaya.data.remote.api

import com.example.yaya.data.remote.dto.*
import com.squareup.moshi.JsonClass
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface YayaApiService {

    // ── Auth (public, no token) ──────────────────────

    @POST("api/v1/mobile/auth/register")
    suspend fun register(@Body request: MobileRegisterRequest): Response<AuthResponse>

    @POST("api/v1/mobile/auth/login")
    suspend fun login(@Body request: MobileLoginRequest): Response<AuthResponse>

    @POST("api/v1/mobile/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<RefreshTokenResponse>

    // ── Dashboard ────────────────────────────────────

    @GET("api/v1/mobile/dashboard")
    suspend fun getDashboard(): Response<DashboardDto>

    // ── Products ─────────────────────────────────────

    @GET("api/v1/mobile/products")
    suspend fun getProducts(
        @Query("search") search: String? = null,
        @Query("category") category: String? = null
    ): Response<List<ProductDto>>

    @GET("api/v1/mobile/products/{id}")
    suspend fun getProductById(@Path("id") id: Int): Response<ProductDto>

    @POST("api/v1/mobile/products")
    suspend fun createProduct(@Body product: CreateProductRequest): Response<ProductDto>

    @PUT("api/v1/mobile/products/{id}")
    suspend fun updateProduct(
        @Path("id") id: Int,
        @Body product: UpdateProductRequest
    ): Response<ProductDto>

    @DELETE("api/v1/mobile/products/{id}")
    suspend fun deleteProduct(@Path("id") id: Int): Response<Unit>

    @Multipart
    @POST("api/v1/mobile/upload/product-image")
    suspend fun uploadProductImage(
        @Part image: MultipartBody.Part
    ): Response<ImageUploadResponse>

    // ── Orders ───────────────────────────────────────

    @GET("api/v1/mobile/orders")
    suspend fun getOrders(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
        @Query("status") status: String? = null
    ): Response<OrderListResponse>

    @GET("api/v1/mobile/orders/{id}")
    suspend fun getOrderById(@Path("id") id: Int): Response<OrderDetailDto>

    @PUT("api/v1/mobile/orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") id: Int,
        @Body request: UpdateOrderStatusRequest
    ): Response<OrderDto>

    // ── Payments ─────────────────────────────────────

    @GET("api/v1/mobile/payments/pending")
    suspend fun getPendingPayments(): Response<List<PendingPaymentDto>>

    @POST("api/v1/mobile/payments/{id}/confirm")
    suspend fun confirmPayment(
        @Path("id") id: Int,
        @Body request: ConfirmPaymentRequest = ConfirmPaymentRequest()
    ): Response<PaymentActionResponse>

    @POST("api/v1/mobile/payments/{id}/reject")
    suspend fun rejectPayment(@Path("id") id: Int): Response<PaymentActionResponse>

    // ── Customers ────────────────────────────────────

    @GET("api/v1/mobile/customers")
    suspend fun getCustomers(): Response<CustomerListResponse>

    @GET("api/v1/mobile/customers/{id}")
    suspend fun getCustomerById(@Path("id") id: Int): Response<CustomerDto>

    // ── Settings ─────────────────────────────────────

    @GET("api/v1/mobile/settings")
    suspend fun getSettings(): Response<Map<String, String>>

    @PUT("api/v1/mobile/settings/{key}")
    suspend fun updateSetting(
        @Path("key") key: String,
        @Body value: UpdateSettingRequest
    ): Response<Unit>

    // ── Subscriptions ────────────────────────────────

    @GET("api/v1/creator/plans")
    suspend fun getCreatorPlans(): Response<List<CreatorPlanDto>>

    @GET("api/v1/creator/subscriptions")
    suspend fun getCustomerSubscriptions(
        @Query("status") status: String? = null,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<CustomerSubscriptionListResponse>

    @POST("api/v1/creator/subscriptions")
    suspend fun subscribeCustomer(
        @Body request: SubscribeCustomerRequest
    ): Response<CustomerSubscriptionDto>

    @POST("api/v1/creator/subscriptions/{id}/cancel")
    suspend fun cancelCustomerSubscription(@Path("id") id: Int): Response<CustomerSubscriptionDto>

    // ── Platform Subscription ────────────────────────

    @GET("api/v1/mobile/subscription")
    suspend fun getPlatformSubscription(): Response<PlatformSubscriptionStatus>

    @GET("api/v1/mobile/plans")
    suspend fun getPlatformPlans(): Response<List<PlatformPlanDto>>

    @POST("api/v1/mobile/subscription/subscribe")
    suspend fun subscribeToPlan(@Body request: SubscribePlanRequest): Response<PlatformSubscriptionStatus>

    // ── WhatsApp ─────────────────────────────────────

    @GET("api/v1/mobile/whatsapp/status")
    suspend fun getWhatsAppStatus(): Response<WhatsAppStatusDto>

    @GET("api/v1/mobile/whatsapp/qr")
    suspend fun getWhatsAppQr(): Response<WhatsAppQrDto>

    @POST("api/v1/mobile/whatsapp/connect")
    suspend fun connectWhatsApp(): Response<WhatsAppActionResponse>

    @POST("api/v1/mobile/whatsapp/disconnect")
    suspend fun disconnectWhatsApp(): Response<WhatsAppActionResponse>

    @POST("api/v1/mobile/whatsapp/reset")
    suspend fun resetWhatsApp(): Response<WhatsAppActionResponse>

    // ── Conversations ─────────────────────────────────

    @GET("api/v1/mobile/conversations")
    suspend fun getConversations(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<ConversationListResponse>

    @GET("api/v1/mobile/conversations/{jid}/messages")
    suspend fun getConversationMessages(
        @Path("jid") jid: String,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<ConversationMessagesResponse>

    @POST("api/v1/mobile/conversations/{jid}/pause-ai")
    suspend fun pauseAi(
        @Path("jid") jid: String,
        @Body request: PauseAiRequest
    ): Response<PauseAiResponse>

    @POST("api/v1/mobile/conversations/{jid}/send")
    suspend fun sendConversationMessage(
        @Path("jid") jid: String,
        @Body request: SendMessageRequest
    ): Response<SendMessageResponse>

    // ── Product Extraction ────────────────────────────

    @Multipart
    @POST("api/v1/mobile/products/extract/from-voice")
    suspend fun extractFromVoice(
        @Part audio: MultipartBody.Part,
        @Part("sessionId") sessionId: okhttp3.RequestBody? = null
    ): Response<ExtractionResponse>

    @POST("api/v1/mobile/products/extract/from-voice")
    suspend fun extractFromText(
        @Body request: VoiceExtractionTextRequest
    ): Response<ExtractionResponse>

    @Multipart
    @POST("api/v1/mobile/products/extract/from-photo")
    suspend fun extractFromPhoto(
        @Part image: MultipartBody.Part,
        @Part("description") description: okhttp3.RequestBody? = null
    ): Response<ExtractionResponse>

    // ── Notification Settings ───────────────────────

    @GET("api/v1/mobile/notifications/settings")
    suspend fun getNotificationSettings(): Response<NotificationSettingsDto>

    @POST("api/v1/mobile/notifications/settings")
    suspend fun updateNotificationSettings(
        @Body request: UpdateNotificationSettingsRequest
    ): Response<OkResponse>

    // ── Google Calendar ─────────────────────────────

    @GET("api/v1/mobile/calendar/auth-url")
    suspend fun getCalendarAuthUrl(): Response<CalendarAuthUrlResponse>

    @POST("api/v1/mobile/calendar/callback")
    suspend fun calendarCallback(
        @Body request: CalendarCallbackRequest
    ): Response<CalendarCallbackResponse>

    @GET("api/v1/mobile/calendar/status")
    suspend fun getCalendarStatus(): Response<CalendarStatusResponse>

    @POST("api/v1/mobile/calendar/disconnect")
    suspend fun disconnectCalendar(): Response<SuccessResponse>

    @GET("api/v1/mobile/calendar/events")
    suspend fun getCalendarEvents(
        @Query("days") days: Int = 7,
        @Query("maxResults") maxResults: Int = 50
    ): Response<CalendarEventsResponse>

    @POST("api/v1/mobile/calendar/sync-appointment")
    suspend fun syncAppointment(
        @Body request: SyncAppointmentRequest
    ): Response<SyncAppointmentResponse>

    @DELETE("api/v1/mobile/calendar/events/{eventId}")
    suspend fun deleteCalendarEvent(
        @Path("eventId") eventId: String
    ): Response<SuccessResponse>

    // ── Follow-up Flows ─────────────────────────────

    @GET("api/v1/mobile/followup-flows")
    suspend fun getFollowUpFlows(): Response<List<FollowUpFlowDto>>

    @POST("api/v1/mobile/followup-flows/{type}/toggle")
    suspend fun toggleFollowUpFlow(
        @Path("type") type: String,
        @Body request: ToggleFlowRequest
    ): Response<OkResponse>

    // ── Agent Chat ─────────────────────────────────────

    @POST("api/v1/agent/chat")
    suspend fun sendAgentMessage(
        @Body request: AgentChatRequest
    ): Response<AgentChatResponse>

    @GET("api/v1/agent/history")
    suspend fun getAgentHistory(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<AgentHistoryResponse>

    // ── Analytics ───────────────────────────────────────

    @GET("api/v1/analytics/summary")
    suspend fun getAnalyticsSummary(
        @Query("period") period: String = "today"
    ): Response<AnalyticsSummaryDto>

    @GET("api/v1/analytics/revenue")
    suspend fun getAnalyticsRevenue(
        @Query("period") period: String = "7d"
    ): Response<RevenueDataDto>

    @GET("api/v1/analytics/expenses")
    suspend fun getAnalyticsExpenses(
        @Query("period") period: String = "7d"
    ): Response<ExpensesDataDto>

    @GET("api/v1/analytics/top-products")
    suspend fun getAnalyticsTopProducts(
        @Query("period") period: String = "7d",
        @Query("limit") limit: Int = 10
    ): Response<TopProductsDto>

    // ── Yape sync ────────────────────────────────────
    // Compatible with both the full autobot backend and the standalone
    // yape-listener service (services/yape-listener). The yape-listener
    // accepts these same paths as backward-compatible aliases.

    @POST("api/v1/yape/payments/sync")
    suspend fun syncPayment(@Body request: PaymentSyncRequest): Response<PaymentSyncResponse>

    @POST("api/v1/yape/payments/sync/batch")
    suspend fun syncPaymentsBatch(@Body request: BatchSyncRequest): Response<BatchSyncResponse>

    @GET("api/v1/health")
    suspend fun healthCheck(): Response<OkResponse>
}

@JsonClass(generateAdapter = true)
data class UpdateSettingRequest(val value: String)
