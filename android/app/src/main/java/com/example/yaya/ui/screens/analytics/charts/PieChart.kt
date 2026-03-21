package com.example.yaya.ui.screens.analytics.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.example.yaya.ui.theme.ConfirmedGreen
import com.example.yaya.ui.theme.PendingAmber
import com.example.yaya.ui.theme.SyncedBlue
import com.example.yaya.ui.theme.YapePurple
import com.example.yaya.ui.theme.UnsyncedOrange

private val pieColors = listOf(
    YapePurple,
    ConfirmedGreen,
    SyncedBlue,
    PendingAmber,
    UnsyncedOrange,
    Color(0xFF8BC34A),
    Color(0xFFE91E63),
    Color(0xFF00BCD4)
)

@Composable
fun PieChart(
    slices: List<Pair<String, Double>>,
    modifier: Modifier = Modifier
) {
    if (slices.isEmpty()) return

    val total = slices.sumOf { it.second }.coerceAtLeast(1.0)

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Donut chart
        Box(
            modifier = Modifier.size(140.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.size(130.dp)) {
                var startAngle = -90f
                slices.forEachIndexed { index, (_, value) ->
                    val sweep = (value / total * 360).toFloat()
                    drawArc(
                        color = pieColors[index % pieColors.size],
                        startAngle = startAngle,
                        sweepAngle = sweep,
                        useCenter = false,
                        style = Stroke(width = 28.dp.toPx(), cap = StrokeCap.Butt)
                    )
                    startAngle += sweep
                }
            }
            Text(
                text = "S/ %.0f".format(total),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        // Legend
        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            slices.forEachIndexed { index, (label, value) ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Canvas(modifier = Modifier.size(10.dp)) {
                        drawCircle(color = pieColors[index % pieColors.size])
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "$label (%.0f%%)".format(value / total * 100),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
