package com.example.yaya.ui.navigation

sealed class Screen(val route: String) {
    // Auth flow
    data object Login : Screen("login")
    data object Register : Screen("register")

    // Main tabs (bottom nav)
    data object Home : Screen("home")
    data object Products : Screen("products")
    data object Orders : Screen("orders")
    data object Profile : Screen("profile")

    // Detail screens
    data object ProductAdd : Screen("products/add")
    data object ProductEdit : Screen("products/edit/{productId}") {
        fun createRoute(productId: Int): String = "products/edit/$productId"
    }
    data object OrderDetail : Screen("orders/{orderId}") {
        fun createRoute(orderId: Int): String = "orders/$orderId"
    }
    data object CustomerList : Screen("customers")
    data object CustomerDetail : Screen("customers/{customerId}") {
        fun createRoute(customerId: Int): String = "customers/$customerId"
    }
    data object PaymentList : Screen("payments")
    data object Settings : Screen("settings")
    data object SubscriptionList : Screen("subscriptions")
    data object Store : Screen("store")
    data object WhatsApp : Screen("whatsapp")
    data object ConversationList : Screen("conversations")
    data object ChatDetail : Screen("conversations/{jid}") {
        fun createRoute(jid: String): String = "conversations/${java.net.URLEncoder.encode(jid, "UTF-8")}"
    }
    data object ProductExtraction : Screen("products/extraction")
    data object NotificationSettings : Screen("notifications/settings")
    data object Calendar : Screen("calendar")
    data object FollowUpFlows : Screen("followup-flows")
}
