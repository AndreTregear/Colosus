package com.example.yaya.ui.screens.orders

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.yaya.ui.components.OrderStatusBadge
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.RejectedRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    onNavigateBack: () -> Unit,
    viewModel: OrderDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalle del pedido") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        when {
            uiState.isLoading -> {
                Box(
                    Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.error != null && uiState.order == null -> {
                Box(
                    Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "Error: ${uiState.error}",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            uiState.order != null -> {
                val order = uiState.order!!

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Order header
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        "Pedido #${order.id}",
                                        style = MaterialTheme.typography.headlineSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    OrderStatusBadge(status = order.status)
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    "Cliente: ${order.customerName ?: "Desconocido"}",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    "Total: S/ %.2f".format(order.total),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                                if (order.deliveryAddress != null) {
                                    Text(
                                        "Direccion: ${order.deliveryAddress}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                if (order.notes != null) {
                                    Text(
                                        "Notas: ${order.notes}",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }

                    // Items section
                    item {
                        Text(
                            "Productos",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    items(order.items) { item ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(
                                        item.productName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        "x${item.quantity} @ S/ %.2f".format(item.unitPrice),
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                Text(
                                    "S/ %.2f".format(item.unitPrice * item.quantity),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    // Pending payments section
                    if (uiState.pendingPayments.isNotEmpty()) {
                        item {
                            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                            Text(
                                "Pagos pendientes",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        items(uiState.pendingPayments) { payment ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            "${payment.method.uppercase()} - S/ %.2f".format(payment.amount),
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                    if (payment.customerName != null) {
                                        Text(
                                            "Cliente: ${payment.customerName}",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                    Spacer(Modifier.height(8.dp))
                                    Row(
                                        Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = { viewModel.confirmPayment(payment.id) },
                                            modifier = Modifier.weight(1f),
                                            enabled = !uiState.isUpdating,
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = ConfirmedGreen
                                            )
                                        ) {
                                            Text("Confirmar")
                                        }
                                        OutlinedButton(
                                            onClick = { viewModel.rejectPayment(payment.id) },
                                            modifier = Modifier.weight(1f),
                                            enabled = !uiState.isUpdating
                                        ) {
                                            Text("Rechazar", color = RejectedRed)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Order status actions
                    item {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
                        Text(
                            "Acciones",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(Modifier.height(8.dp))

                        when (order.status) {
                            "pending" -> {
                                Button(
                                    onClick = { viewModel.updateStatus("confirmed") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Confirmar pedido")
                                }
                                Spacer(Modifier.height(8.dp))
                                OutlinedButton(
                                    onClick = { viewModel.updateStatus("cancelled") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Cancelar pedido", color = RejectedRed)
                                }
                            }
                            "confirmed" -> {
                                Button(
                                    onClick = { viewModel.updateStatus("payment_requested") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Solicitar pago")
                                }
                            }
                            "payment_requested", "paid" -> {
                                Button(
                                    onClick = { viewModel.updateStatus("preparing") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Empezar a preparar")
                                }
                            }
                            "preparing" -> {
                                Button(
                                    onClick = { viewModel.updateStatus("shipped") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Marcar como enviado")
                                }
                            }
                            "shipped" -> {
                                Button(
                                    onClick = { viewModel.updateStatus("delivered") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !uiState.isUpdating
                                ) {
                                    Text("Marcar como entregado")
                                }
                            }
                        }

                        // Feedback messages
                        uiState.actionSuccess?.let {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                it,
                                color = ConfirmedGreen,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        if (uiState.error != null && !uiState.isLoading) {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Error: ${uiState.error}",
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }
            }
        }
    }
}
