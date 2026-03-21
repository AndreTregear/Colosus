package com.example.yaya.ui.screens.whatsapp

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.PendingAmber
import com.example.yaya.ui.theme.RejectedRed

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WhatsAppScreen(
    onNavigateBack: () -> Unit,
    viewModel: WhatsAppViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.startPolling()
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopPolling()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("WhatsApp") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver"
                        )
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Connection status banner
                ConnectionStatusBanner(
                    connectionStatus = uiState.connectionStatus,
                    errorMessage = uiState.errorMessage
                )

                // Error from actions
                uiState.error?.let { error ->
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                // QR section (when waiting for scan)
                if (uiState.connectionStatus == "waiting" || uiState.qrAvailable) {
                    QrCodeSection(qrDataUrl = uiState.qrDataUrl)
                }

                // Action buttons
                ActionButtonsSection(
                    connectionStatus = uiState.connectionStatus,
                    isActionLoading = uiState.isActionLoading,
                    onConnect = viewModel::connect,
                    onDisconnect = viewModel::showDisconnectDialog,
                    onReset = viewModel::showResetDialog
                )

                // Session info card
                SessionInfoCard(
                    phoneNumber = uiState.phoneNumber,
                    lastConnectedAt = uiState.lastConnectedAt,
                    reconnectAttempts = uiState.reconnectAttempts,
                    workerRunning = uiState.workerRunning
                )
            }
        }

        // Disconnect confirmation dialog
        if (uiState.showDisconnectDialog) {
            AlertDialog(
                onDismissRequest = viewModel::dismissDisconnectDialog,
                title = { Text("Confirmar desconexion") },
                text = { Text("Estas seguro de que deseas desconectar WhatsApp?") },
                confirmButton = {
                    Button(
                        onClick = viewModel::disconnect,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = RejectedRed
                        )
                    ) {
                        Text("Confirmar")
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::dismissDisconnectDialog) {
                        Text("Cancelar")
                    }
                }
            )
        }

        // Reset confirmation dialog
        if (uiState.showResetDialog) {
            AlertDialog(
                onDismissRequest = viewModel::dismissResetDialog,
                title = { Text("Reiniciar") },
                text = { Text("Esto eliminara la sesion actual y generara un nuevo codigo QR") },
                confirmButton = {
                    Button(
                        onClick = viewModel::reset,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PendingAmber
                        )
                    ) {
                        Text("Confirmar")
                    }
                },
                dismissButton = {
                    TextButton(onClick = viewModel::dismissResetDialog) {
                        Text("Cancelar")
                    }
                }
            )
        }
    }
}

@Composable
private fun ConnectionStatusBanner(
    connectionStatus: String,
    errorMessage: String?
) {
    val (backgroundColor, icon, statusText) = when (connectionStatus) {
        "connected" -> Triple(ConfirmedGreen, Icons.Default.CheckCircle, "Conectado")
        "connecting", "waiting" -> Triple(PendingAmber, Icons.Default.Sync, "Conectando...")
        "error" -> Triple(RejectedRed, Icons.Default.Error, errorMessage ?: "Error")
        else -> Triple(RejectedRed, Icons.Default.LinkOff, "Desconectado")
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(backgroundColor.copy(alpha = 0.15f))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(backgroundColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = backgroundColor,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = backgroundColor
                )
                if (connectionStatus == "error" && errorMessage != null) {
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun QrCodeSection(qrDataUrl: String?) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.QrCode,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Escanea con WhatsApp",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (qrDataUrl != null) {
                QrCodeImage(
                    dataUrl = qrDataUrl,
                    modifier = Modifier.size(250.dp)
                )
            } else {
                Box(
                    modifier = Modifier.size(250.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    }
}

@Composable
private fun QrCodeImage(
    dataUrl: String,
    modifier: Modifier = Modifier
) {
    val bitmap = remember(dataUrl) {
        try {
            val base64Data = if (dataUrl.contains(",")) {
                dataUrl.substringAfter(",")
            } else {
                dataUrl
            }
            val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
        } catch (e: Exception) {
            null
        }
    }

    if (bitmap != null) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "Codigo QR de WhatsApp",
            modifier = modifier,
            contentScale = ContentScale.Fit
        )
    } else {
        Box(
            modifier = modifier,
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No se pudo cargar el codigo QR",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun ActionButtonsSection(
    connectionStatus: String,
    isActionLoading: Boolean,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit,
    onReset: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        when (connectionStatus) {
            "disconnected" -> {
                Button(
                    onClick = onConnect,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isActionLoading
                ) {
                    if (isActionLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Conectar WhatsApp")
                }
            }

            "connected" -> {
                OutlinedButton(
                    onClick = onDisconnect,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isActionLoading,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = RejectedRed
                    )
                ) {
                    if (isActionLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Icon(
                        Icons.Default.LinkOff,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Desconectar")
                }

                OutlinedButton(
                    onClick = onReset,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isActionLoading
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Reiniciar conexion")
                }
            }

            "error" -> {
                Button(
                    onClick = onConnect,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isActionLoading
                ) {
                    if (isActionLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Conectar WhatsApp")
                }

                OutlinedButton(
                    onClick = onReset,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isActionLoading
                ) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Reiniciar conexion")
                }
            }

            "connecting", "waiting" -> {
                // While connecting, show a disabled state with progress
                OutlinedButton(
                    onClick = {},
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Conectando...")
                }
            }
        }
    }
}

@Composable
private fun SessionInfoCard(
    phoneNumber: String?,
    lastConnectedAt: String?,
    reconnectAttempts: Int,
    workerRunning: Boolean
) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Informacion de sesion",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(4.dp))

            SessionInfoRow(
                label = "Telefono:",
                value = phoneNumber ?: "-"
            )

            SessionInfoRow(
                label = "Ultima conexion:",
                value = lastConnectedAt ?: "-"
            )

            SessionInfoRow(
                label = "Intentos de reconexion:",
                value = reconnectAttempts.toString()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Worker:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (workerRunning) ConfirmedGreen else RejectedRed)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (workerRunning) "Activo" else "Detenido",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (workerRunning) ConfirmedGreen else RejectedRed
                    )
                }
            }
        }
    }
}

@Composable
private fun SessionInfoRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}
