package com.example.yaya.ui.screens.analytics.charts

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun LineChart(
    points: List<Pair<String, Double>>,
    modifier: Modifier = Modifier,
    lineColor: Color = MaterialTheme.colorScheme.primary,
    gridColor: Color = MaterialTheme.colorScheme.outlineVariant
) {
    if (points.isEmpty()) return

    val textColor = MaterialTheme.colorScheme.onSurfaceVariant

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
    ) {
        val paddingLeft = 60f
        val paddingBottom = 40f
        val paddingTop = 16f
        val paddingRight = 16f

        val chartWidth = size.width - paddingLeft - paddingRight
        val chartHeight = size.height - paddingTop - paddingBottom

        val maxValue = points.maxOf { it.second }.coerceAtLeast(1.0)
        val minValue = 0.0

        val valueRange = maxValue - minValue

        // Draw horizontal grid lines
        val gridLines = 4
        for (i in 0..gridLines) {
            val y = paddingTop + chartHeight * (1 - i.toFloat() / gridLines)
            drawLine(
                color = gridColor,
                start = Offset(paddingLeft, y),
                end = Offset(size.width - paddingRight, y),
                strokeWidth = 1f
            )
            // Y-axis labels
            val label = "S/ %.0f".format(minValue + valueRange * i / gridLines)
            drawContext.canvas.nativeCanvas.drawText(
                label,
                4f,
                y + 4f,
                android.graphics.Paint().apply {
                    color = textColor.hashCode()
                    textSize = 9.sp.toPx()
                    isAntiAlias = true
                }
            )
        }

        if (points.size < 2) return@Canvas

        // Draw line
        val path = Path()
        points.forEachIndexed { index, (_, value) ->
            val x = paddingLeft + chartWidth * index / (points.size - 1)
            val y = paddingTop + chartHeight * (1 - ((value - minValue) / valueRange)).toFloat()

            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }

        drawPath(
            path = path,
            color = lineColor,
            style = Stroke(width = 3.dp.toPx())
        )

        // Draw data points
        points.forEachIndexed { index, (_, value) ->
            val x = paddingLeft + chartWidth * index / (points.size - 1)
            val y = paddingTop + chartHeight * (1 - ((value - minValue) / valueRange)).toFloat()
            drawCircle(
                color = lineColor,
                radius = 4.dp.toPx(),
                center = Offset(x, y)
            )
        }

        // X-axis labels (show max 5 to avoid crowding)
        val step = (points.size / 5).coerceAtLeast(1)
        points.forEachIndexed { index, (label, _) ->
            if (index % step == 0 || index == points.size - 1) {
                val x = paddingLeft + chartWidth * index / (points.size - 1)
                drawContext.canvas.nativeCanvas.drawText(
                    label,
                    x - 10f,
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
