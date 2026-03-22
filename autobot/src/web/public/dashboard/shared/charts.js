// Yaya Platform — Canvas Charts
// Brand colors
const COLORS = {
  primary: '#FF6B35',
  navy: '#2D3142',
  gray: '#4F5D75',
  green: '#28A745',
  red: '#DC3545',
  yellow: '#FFC107',
  blue: '#007BFF',
  orange: '#FF8F65',
  purple: '#6F42C1',
  teal: '#20C997',
};

const PALETTE = [COLORS.primary, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.purple, COLORS.teal, COLORS.red, COLORS.navy];

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h: rect.height };
}

// ========== LINE CHART ==========
export function drawLineChart(canvas, data, options = {}) {
  if (!canvas || !data?.labels?.length) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const {
    lineColor = COLORS.primary,
    fillColor = 'rgba(255,107,53,0.1)',
    gridColor = '#E2E5ED',
    textColor = '#8B8FA3',
    showDots = true,
    showFill = true,
    yPrefix = 'S/ ',
  } = options;

  const padL = 60, padR = 20, padT = 20, padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const values = data.values || [];
  const maxVal = Math.max(...values, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (chartH * i / gridLines);
    const val = maxVal - (range * i / gridLines);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(yPrefix + Math.round(val), padL - 8, y + 4);
  }

  // X labels
  ctx.textAlign = 'center';
  ctx.fillStyle = textColor;
  const labels = data.labels || [];
  labels.forEach((label, i) => {
    const x = padL + (chartW * i / (labels.length - 1 || 1));
    ctx.fillText(label, x, h - 8);
  });

  if (values.length < 2) return;

  // Line path
  const points = values.map((v, i) => ({
    x: padL + (chartW * i / (values.length - 1)),
    y: padT + chartH - (chartH * (v - minVal) / range),
  }));

  // Fill
  if (showFill) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, padT + chartH);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dots
  if (showDots) {
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

// ========== BAR CHART ==========
export function drawBarChart(canvas, data, options = {}) {
  if (!canvas || !data?.labels?.length) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const {
    colors = PALETTE,
    gridColor = '#E2E5ED',
    textColor = '#8B8FA3',
    yPrefix = 'S/ ',
    horizontal = false,
  } = options;

  const padL = 60, padR = 20, padT = 20, padB = 50;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const values = data.values || [];
  const labels = data.labels || [];
  const maxVal = Math.max(...values, 1);

  // Grid
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (chartH * i / gridLines);
    const val = maxVal - (maxVal * i / gridLines);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.fillText(yPrefix + Math.round(val), padL - 8, y + 4);
  }

  // Bars
  const barW = Math.min(40, (chartW / labels.length) * 0.6);
  const gap = chartW / labels.length;

  labels.forEach((label, i) => {
    const x = padL + gap * i + (gap - barW) / 2;
    const barH = (values[i] / maxVal) * chartH;
    const y = padT + chartH - barH;

    // Bar with rounded top
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    const r = Math.min(4, barW / 2);
    ctx.moveTo(x, padT + chartH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, padT + chartH);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, system-ui, sans-serif';
    const labelX = x + barW / 2;
    // Truncate long labels
    const maxChars = Math.floor(gap / 7);
    const truncLabel = label.length > maxChars ? label.slice(0, maxChars) + '…' : label;
    ctx.fillText(truncLabel, labelX, h - 8);
  });
}

// ========== PIE CHART ==========
export function drawPieChart(canvas, data, options = {}) {
  if (!canvas || !data?.labels?.length) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const {
    colors = PALETTE,
    textColor = '#2D3142',
    showLegend = true,
  } = options;

  const values = data.values || [];
  const labels = data.labels || [];
  const total = values.reduce((a, b) => a + b, 0) || 1;

  const cx = showLegend ? w * 0.35 : w / 2;
  const cy = h / 2;
  const radius = Math.min(cx - 20, cy - 20, 100);

  let angle = -Math.PI / 2;

  values.forEach((val, i) => {
    const sliceAngle = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // White separator
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    angle += sliceAngle;
  });

  // Inner circle (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Center text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(total.toFixed(0), cx, cy + 2);
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#8B8FA3';
  ctx.fillText('Total', cx, cy + 18);

  // Legend
  if (showLegend) {
    const legendX = w * 0.65;
    let legendY = 30;
    ctx.textAlign = 'left';

    labels.forEach((label, i) => {
      if (legendY > h - 10) return;
      const pct = ((values[i] / total) * 100).toFixed(1);

      // Color dot
      ctx.beginPath();
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '12px Inter, system-ui, sans-serif';
      const maxW = w - legendX - 20;
      const truncLabel = label.length > 16 ? label.slice(0, 16) + '…' : label;
      ctx.fillText(`${truncLabel} (${pct}%)`, legendX + 14, legendY + 4);

      legendY += 24;
    });
  }
}

// ========== RESIZE HANDLER ==========
const resizeCallbacks = new Map();

export function autoResize(canvas, drawFn) {
  if (resizeCallbacks.has(canvas)) return;
  const handler = () => drawFn();
  resizeCallbacks.set(canvas, handler);
  window.addEventListener('resize', debounce(handler, 200));
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
