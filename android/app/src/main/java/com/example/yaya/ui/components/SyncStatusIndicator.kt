package com.example.yaya.ui.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.yaya.data.model.SyncStatus
import com.example.yaya.ui.theme.SyncFailedRed
import com.example.yaya.ui.theme.SyncedBlue
import com.example.yaya.ui.theme.UnsyncedOrange

@Composable
fun SyncStatusIndicator(
    syncStatus: SyncStatus,
    modifier: Modifier = Modifier
) {
    val (icon, color, label) = when (syncStatus) {
        SyncStatus.UNSYNCED -> Triple(Icons.Default.CloudOff, UnsyncedOrange, "Sin sincronizar")
        SyncStatus.SYNCING -> Triple(Icons.Default.CloudUpload, SyncedBlue, "Sincronizando...")
        SyncStatus.SYNCED -> Triple(Icons.Default.CloudDone, SyncedBlue, "Sincronizado")
        SyncStatus.FAILED -> Triple(Icons.Default.Error, SyncFailedRed, "Error de sync")
    }

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = color,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}
