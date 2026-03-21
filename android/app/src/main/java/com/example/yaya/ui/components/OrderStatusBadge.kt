package com.example.yaya.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.PendingAmber
import com.example.yaya.ui.theme.RejectedRed
import com.example.yaya.ui.theme.SyncedBlue
import com.example.yaya.ui.theme.UnsyncedOrange
import com.example.yaya.ui.theme.ExpiredGray
import com.example.yaya.ui.theme.YapePurple

@Composable
fun OrderStatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, text) = when (status) {
        "pending" -> PendingAmber to "Pendiente"
        "confirmed" -> SyncedBlue to "Confirmado"
        "payment_requested" -> UnsyncedOrange to "Pago solicitado"
        "paid" -> ConfirmedGreen to "Pagado"
        "preparing" -> YapePurple to "Preparando"
        "shipped" -> SyncedBlue to "Enviado"
        "delivered" -> ConfirmedGreen to "Entregado"
        "cancelled" -> RejectedRed to "Cancelado"
        else -> ExpiredGray to status
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(backgroundColor.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = backgroundColor.darken()
        )
    }
}

private fun Color.darken(factor: Float = 0.3f): Color {
    return Color(
        red = red * (1 - factor),
        green = green * (1 - factor),
        blue = blue * (1 - factor),
        alpha = alpha
    )
}
