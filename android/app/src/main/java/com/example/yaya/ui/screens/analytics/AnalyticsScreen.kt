package com.example.yaya.ui.screens.analytics

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.yaya.ui.screens.analytics.charts.BarChart
import com.example.yaya.ui.screens.analytics.charts.LineChart
import com.example.yaya.ui.screens.analytics.charts.PieChart
import com.example.yaya.ui.screens.analytics.charts.StatCard
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.RejectedRed
import com.example.yaya.ui.theme.YapePurple

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnalyticsScreen(
    onNavigateBack: () -> Unit,
    viewModel: AnalyticsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Analiticas", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        PullToRefreshBox(
            isRefreshing = uiState.isRefreshing,
            onRefresh = { viewModel.refresh() },
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Date range selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        DateRange.entries.forEach { range ->
                            FilterChip(
                                selected = uiState.selectedRange == range,
                                onClick = { viewModel.selectRange(range) },
                                label = { Text(range.label) }
                            )
                        }
                    }

                    // Error
                    uiState.error?.let { error ->
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }

                    // KPI cards — 2x2 grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            icon = Icons.Default.AttachMoney,
                            value = "S/ %.2f".format(uiState.todayRevenue),
                            label = "Ingresos",
                            trend = uiState.revenueTrend,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            icon = Icons.Default.AccountBalanceWallet,
                            value = "S/ %.2f".format(uiState.todayExpenses),
                            label = "Gastos",
                            trend = uiState.expensesTrend,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            icon = Icons.Default.TrendingUp,
                            value = "S/ %.2f".format(uiState.todayProfit),
                            label = "Ganancia",
                            trend = uiState.profitTrend,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            icon = Icons.Default.Payments,
                            value = "S/ %.2f".format(uiState.pendingPayments),
                            label = "Pendientes",
                            trend = uiState.pendingTrend,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Revenue chart
                    if (uiState.revenuePoints.isNotEmpty()) {
                        ChartSection(title = "Ingresos") {
                            LineChart(
                                points = uiState.revenuePoints.map { it.label to it.value },
                                lineColor = ConfirmedGreen
                            )
                        }
                    }

                    // Expenses by category
                    if (uiState.expenseCategories.isNotEmpty()) {
                        ChartSection(title = "Gastos por categoria") {
                            PieChart(
                                slices = uiState.expenseCategories.map {
                                    it.category to it.amount
                                }
                            )
                        }
                    }

                    // Top products
                    if (uiState.topProducts.isNotEmpty()) {
                        ChartSection(title = "Productos mas vendidos") {
                            BarChart(
                                data = uiState.topProducts.map { it.name to it.revenue },
                                horizontal = true,
                                barColor = YapePurple
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun ChartSection(
    title: String,
    content: @Composable () -> Unit
) {
    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}
