package com.example.yaya.ui.screens.followup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.filled.PersonSearch
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.yaya.data.remote.dto.FollowUpFlowDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FollowUpFlowsScreen(
    onNavigateBack: () -> Unit,
    viewModel: FollowUpFlowsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Seguimientos automaticos") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Description
            item {
                Text(
                    text = "Yaya enviara mensajes automaticos a tus clientes en los momentos clave. Activa o desactiva cada flujo segun tu negocio.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            // Toggle all
            item {
                val allEnabled = uiState.flows.all { it.enabled }
                val allDisabled = uiState.flows.none { it.enabled }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    if (!allEnabled) {
                        TextButton(
                            onClick = { viewModel.toggleAll(true) },
                            enabled = uiState.togglingType == null
                        ) {
                            Text("Activar todos")
                        }
                    }
                    if (!allDisabled) {
                        TextButton(
                            onClick = { viewModel.toggleAll(false) },
                            enabled = uiState.togglingType == null
                        ) {
                            Text("Desactivar todos")
                        }
                    }
                }
            }

            // Flow cards
            items(uiState.flows, key = { it.type }) { flow ->
                FlowCard(
                    flow = flow,
                    isToggling = uiState.togglingType == flow.type || uiState.togglingType == "all",
                    onToggle = { enabled -> viewModel.toggleFlow(flow.type, enabled) }
                )
            }

            // Error
            if (uiState.error != null) {
                item {
                    Text(
                        text = uiState.error!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun FlowCard(
    flow: FollowUpFlowDto,
    isToggling: Boolean,
    onToggle: (Boolean) -> Unit
) {
    val (icon, title, description, messagePreview) = getFlowInfo(flow.type)

    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = if (flow.enabled) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(28.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (isToggling) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Switch(
                        checked = flow.enabled,
                        onCheckedChange = { onToggle(it) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Trigger info
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.AccessTime,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = formatDelay(flow.delayHours),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Message preview
            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = messagePreview,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3
                )
            }
        }
    }
}

private data class FlowInfo(
    val icon: ImageVector,
    val title: String,
    val description: String,
    val messagePreview: String
)

private fun getFlowInfo(type: String): FlowInfo {
    return when (type) {
        "post_purchase" -> FlowInfo(
            icon = Icons.Default.NotificationsActive,
            title = "Post-compra",
            description = "Despues de entregar un pedido",
            messagePreview = "\"Hola! Todo bien con tu pedido? Esperamos que te haya encantado. Responde REPETIR si quieres pedir lo mismo.\""
        )
        "abandoned_cart" -> FlowInfo(
            icon = Icons.Default.ShoppingCart,
            title = "Carrito abandonado",
            description = "Cuando un pedido queda pendiente",
            messagePreview = "\"Hola! Veo que dejaste un pedido pendiente. Te quedaste con las ganas? Responde SI y te ayudo a completarlo.\""
        )
        "no_show" -> FlowInfo(
            icon = Icons.Default.EventBusy,
            title = "Cita perdida",
            description = "Cuando un cliente no asiste a su cita",
            messagePreview = "\"Hola! Te extrañamos hoy en tu cita. Todo bien? Si quieres reagendar, responde CITA.\""
        )
        "re_engagement" -> FlowInfo(
            icon = Icons.Default.PersonSearch,
            title = "Re-engagement",
            description = "Cuando un cliente lleva 30 dias sin comprar",
            messagePreview = "\"Hola! Te extrañamos por aqui. Tenemos novedades que te pueden interesar. Responde VER y te cuento.\""
        )
        "payment_reminder" -> FlowInfo(
            icon = Icons.Default.Payment,
            title = "Recordatorio de pago",
            description = "Cuando un pago queda pendiente",
            messagePreview = "\"Hola! Tu pedido esta listo pero aun no recibimos el pago. Puedes pagar por Yape al numero...\""
        )
        else -> FlowInfo(
            icon = Icons.AutoMirrored.Filled.Send,
            title = type.replace("_", " ").replaceFirstChar { it.uppercase() },
            description = "Flujo automatico",
            messagePreview = "Mensaje automatico configurado"
        )
    }
}

private fun formatDelay(hours: Int): String {
    return when {
        hours < 1 -> "$hours min despues"
        hours == 1 -> "1 hora despues"
        hours < 24 -> "$hours horas despues"
        hours == 24 -> "1 dia despues"
        hours < 720 -> "${hours / 24} dias despues"
        else -> "${hours / 720} meses despues"
    }
}
