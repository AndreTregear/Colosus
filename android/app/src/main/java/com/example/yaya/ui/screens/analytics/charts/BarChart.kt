package com.example.yaya.ui.screens.analytics.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun BarChart(
    data: List<Pair<String, Double>>,
    modifier: Modifier = Modifier,
    barColor: Color = MaterialTheme.colorScheme.primary,
    horizontal: Boolean = false
) {
    if (data.isEmpty()) return

    val textColor = MaterialTheme.colorScheme.onSurfaceVariant

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(if (horizontal) (data.size * 40 + 20).dp else 200.dp)
    ) {
        val maxValue = data.maxOf { it.second }.coerceAtLeast(1.0)

        if (horizontal) {
            val paddingLeft = 100f
            val paddingRight = 60f
            val barHeight = 28.dp.toPx()
            val gap = 12.dp.toPx()
            val chartWidth = size.width - paddingLeft - paddingRight

            data.forEachIndexed { index, (label, value) ->
                val y = index * (barHeight + gap) + gap
                val width = (chartWidth * (value / maxValue)).toFloat()

                // Bar
                drawRoundRect(
                    color = barColor,
                    topLeft = Offset(paddingLeft, y),
                    size = Size(width, barHeight),
                    cornerRadius = CornerRadius(4.dp.toPx())
                )

                // Label
                drawContext.canvas.nativeCanvas.drawText(
                    label,
                    4f,
                    y + barHeight * 0.7f,
                    android.graphics.Paint().apply {
                        color = textColor.hashCode()
                        textSize = 11.sp.toPx()
                        isAntiAlias = true
                    }
                )

                // Value
                drawContext.canvas.nativeCanvas.drawText(
                    "S/ %.0f".format(value),
                    paddingLeft + width + 8f,
                    y + barHeight * 0.7f,
                    android.graphics.Paint().apply {
                        color = textColor.hashCode()
                        textSize = 10.sp.toPx()
                        isAntiAlias = true
                    }
                )
            }
        } else {
            val paddingLeft = 50f
            val paddingBottom = 40f
            val paddingTop = 16f
            val paddingRight = 16f
            val chartWidth = size.width - paddingLeft - paddingRight
            val chartHeight = size.height - paddingTop - paddingBottom

            val barWidth = (chartWidth / data.size * 0.7f)
            val gap = (chartWidth / data.size * 0.3f)

            data.forEachIndexed { index, (label, value) ->
                val barHeightPx = (chartHeight * (value / maxValue)).toFloat()
                val x = paddingLeft + index * (barWidth + gap) + gap / 2

                // Bar
                drawRoundRect(
                    color = barColor,
                    topLeft = Offset(x, paddingTop + chartHeight - barHeightPx),
                    size = Size(barWidth, barHeightPx),
                    cornerRadius = CornerRadius(4.dp.toPx(), 4.dp.toPx())
                )

                // Label
                drawContext.canvas.nativeCanvas.drawText(
                    label,
                    x + barWidth / 2 - 10f,
                    size.height - 4f,
                    android.graphics.Paint().apply {
                        color = textColor.hashCode()
                        textSize = 9.sp.toPx()
                        isAntiAlias = true
                    }
                )
            }
        }
    }
}
