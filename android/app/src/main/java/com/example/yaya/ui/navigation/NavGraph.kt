package com.example.yaya.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.yaya.ui.screens.auth.LoginScreen
import com.example.yaya.ui.screens.auth.RegisterScreen
import com.example.yaya.ui.screens.conversations.ChatDetailScreen
import com.example.yaya.ui.screens.conversations.ConversationListScreen
import com.example.yaya.ui.screens.customers.CustomerDetailScreen
import com.example.yaya.ui.screens.customers.CustomerListScreen
import com.example.yaya.ui.screens.dashboard.DashboardScreen
import com.example.yaya.ui.screens.onboarding.OnboardingScreen
import com.example.yaya.ui.screens.orders.OrderDetailScreen
import com.example.yaya.ui.screens.orders.OrderListScreen
import com.example.yaya.ui.screens.payments.PaymentListScreen
import com.example.yaya.ui.screens.products.ProductFormScreen
import com.example.yaya.ui.screens.products.ProductListScreen
import com.example.yaya.ui.screens.products.ProductListViewModel
import com.example.yaya.ui.screens.profile.ProfileScreen
import com.example.yaya.ui.screens.settings.SettingsScreen
import com.example.yaya.ui.screens.store.StoreScreen
import com.example.yaya.ui.screens.whatsapp.WhatsAppScreen
import com.example.yaya.ui.screens.subscriptions.SubscriptionListScreen
import com.example.yaya.ui.screens.extraction.ProductExtractionScreen
import com.example.yaya.ui.screens.notifications.NotificationSettingsScreen
import com.example.yaya.ui.screens.calendar.CalendarScreen
import com.example.yaya.ui.screens.agent.AgentChatScreen
import com.example.yaya.ui.screens.analytics.AnalyticsScreen
import com.example.yaya.ui.screens.followup.FollowUpFlowsScreen

private data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector
)

private val bottomNavItems = listOf(
    BottomNavItem(Screen.Home, "Inicio", Icons.Default.Home),
    BottomNavItem(Screen.AgentChat, "Yaya", Icons.Default.SmartToy),
    BottomNavItem(Screen.Analytics, "Analiticas", Icons.Default.BarChart),
    BottomNavItem(Screen.Orders, "Pedidos", Icons.Default.Receipt),
    BottomNavItem(Screen.Profile, "Perfil", Icons.Default.Person),
)

@Composable
fun OnboardingNavGraph(onOnboardingComplete: () -> Unit) {
    OnboardingScreen(onOnboardingComplete = onOnboardingComplete)
}

@Composable
fun AuthNavGraph(onLoginSuccess: () -> Unit) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = onLoginSuccess,
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = onLoginSuccess,
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }
    }
}

@Composable
fun MainNavGraph(onLogout: () -> Unit) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Show bottom nav only on tab roots
    val showBottomNav = currentRoute in bottomNavItems.map { it.screen.route }

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            icon = { Icon(item.icon, contentDescription = item.label) },
                            label = { Text(item.label) },
                            selected = currentRoute == item.screen.route,
                            onClick = {
                                if (currentRoute != item.screen.route) {
                                    navController.navigate(item.screen.route) {
                                        popUpTo(Screen.Home.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // ── Tab roots ────────────────────────────

            composable(Screen.Home.route) {
                DashboardScreen(
                    onNavigateToProducts = { navController.navigate(Screen.Products.route) },
                    onNavigateToOrders = { navController.navigate(Screen.Orders.route) },
                    onNavigateToPayments = { navController.navigate(Screen.PaymentList.route) },
                    onNavigateToWhatsApp = { navController.navigate(Screen.WhatsApp.route) }
                )
            }

            composable(Screen.AgentChat.route) {
                AgentChatScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Analytics.route) {
                AnalyticsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.ConversationList.route) {
                ConversationListScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onConversationClick = { jid, _ ->
                        navController.navigate(Screen.ChatDetail.createRoute(jid))
                    }
                )
            }

            composable(Screen.Products.route) { backStackEntry ->
                val viewModel: ProductListViewModel = hiltViewModel()
                val productSaved by backStackEntry.savedStateHandle
                    .getStateFlow("product_saved", false).collectAsState()
                LaunchedEffect(productSaved) {
                    if (productSaved) {
                        viewModel.loadProducts()
                        backStackEntry.savedStateHandle["product_saved"] = false
                    }
                }
                ProductListScreen(
                    viewModel = viewModel,
                    onAddProduct = { navController.navigate(Screen.ProductAdd.route) },
                    onEditProduct = { id -> navController.navigate(Screen.ProductEdit.createRoute(id)) },
                    onExtractProducts = { navController.navigate(Screen.ProductExtraction.route) }
                )
            }

            composable(Screen.Orders.route) {
                OrderListScreen(
                    onNavigateBack = null,
                    onOrderClick = { id -> navController.navigate(Screen.OrderDetail.createRoute(id)) }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onLogout = onLogout,
                    onNavigateToCustomers = { navController.navigate(Screen.CustomerList.route) },
                    onNavigateToPayments = { navController.navigate(Screen.PaymentList.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onNavigateToSubscriptions = { navController.navigate(Screen.SubscriptionList.route) },
                    onNavigateToStore = { navController.navigate(Screen.Store.route) },
                    onNavigateToNotificationSettings = { navController.navigate(Screen.NotificationSettings.route) },
                    onNavigateToCalendar = { navController.navigate(Screen.Calendar.route) },
                    onNavigateToFollowUpFlows = { navController.navigate(Screen.FollowUpFlows.route) }
                )
            }

            // ── Detail screens ───────────────────────

            composable(Screen.ProductAdd.route) {
                ProductFormScreen(
                    productId = null,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = {
                        navController.previousBackStackEntry
                            ?.savedStateHandle?.set("product_saved", true)
                        navController.popBackStack()
                    }
                )
            }

            composable(
                route = Screen.ProductEdit.route,
                arguments = listOf(navArgument("productId") { type = NavType.IntType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getInt("productId")
                ProductFormScreen(
                    productId = productId,
                    onNavigateBack = { navController.popBackStack() },
                    onSaved = {
                        navController.previousBackStackEntry
                            ?.savedStateHandle?.set("product_saved", true)
                        navController.popBackStack()
                    }
                )
            }

            composable(
                route = Screen.OrderDetail.route,
                arguments = listOf(navArgument("orderId") { type = NavType.IntType })
            ) {
                OrderDetailScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.CustomerList.route) {
                CustomerListScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onCustomerClick = { id -> navController.navigate(Screen.CustomerDetail.createRoute(id)) }
                )
            }

            composable(
                route = Screen.CustomerDetail.route,
                arguments = listOf(navArgument("customerId") { type = NavType.IntType })
            ) {
                CustomerDetailScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.PaymentList.route) {
                PaymentListScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.SubscriptionList.route) {
                SubscriptionListScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Store.route) {
                StoreScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.WhatsApp.route) {
                WhatsAppScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(
                route = Screen.ChatDetail.route,
                arguments = listOf(navArgument("jid") { type = NavType.StringType })
            ) {
                ChatDetailScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            // ── New feature screens ─────────────────────

            composable(Screen.ProductExtraction.route) {
                ProductExtractionScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.NotificationSettings.route) {
                NotificationSettingsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Calendar.route) {
                CalendarScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }

            composable(Screen.FollowUpFlows.route) {
                FollowUpFlowsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
