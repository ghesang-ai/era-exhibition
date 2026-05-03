/* ═══════════════════════════════════════════════
   ERA-EXHIBITION — SIERA Chart Engine (pure SVG)
   No external dependencies
   ═══════════════════════════════════════════════ */

const SIERA_COLORS = {
  teal:   '#1D9E75',
  blue:   '#378ADD',
  violet: '#7F77DD',
  amber:  '#EF9F27',
  red:    '#D85A30',
  text2:  '#5A5D63',
  text3:  '#9EA1A8',
  border: '#EAEBED',
  bgMuted:'#F7F8F9',
};

/* ── Utility ── */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function formatK(v) {
  if (!isFinite(v)) return '0';
  // Strip floating point artifacts before formatting
  v = parseFloat(v.toPrecision(6));
  if (v >= 1e9)  return (v / 1e9).toFixed(1).replace(/\.0$/, '') + ' M';
  if (v >= 1e6)  return (v / 1e6).toFixed(1).replace(/\.0$/, '') + ' jt';
  if (v >= 1000) return Math.round(v / 10) * 10 >= 1000
                      ? (Math.round(v / 10) * 10 / 1000).toFixed(1).replace(/\.0$/, '') + ' rb'
                      : String(Math.round(v));
  if (v >= 10)  return String(Math.round(v));
  return parseFloat(v.toFixed(1)).toString();
}

function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev[0] + curr[0]) / 2;
    d += ` C ${cpX} ${prev[1]}, ${cpX} ${curr[1]}, ${curr[0]} ${curr[1]}`;
  }
  return d;
}

/* ══════════════════════════════════════════
   LINE CHART — dual series (Walk-in + Revenue)
   ══════════════════════════════════════════ */
function renderLineChart(containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const data    = opts.data || [];
  const labels  = opts.labels || [];
  const series  = opts.series || [];  // [{label, values, color, format}]
  const H       = opts.height || 180;

  const W       = Math.max(container.clientWidth || 0, 320);
  const pad     = { top: 18, right: 24, bottom: 36, left: 58 };
  const chartW  = W - pad.left - pad.right;
  const chartH  = H - pad.top - pad.bottom;
  const n       = labels.length;

  if (n < 2) return;

  const svg = svgEl('svg', { width: W, height: H, style: 'display:block;overflow:visible' });

  // Gradient defs
  const defs = svgEl('defs');
  series.forEach((s, si) => {
    const gid = `grad-${containerId}-${si}`;
    const grad = svgEl('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
    const stop1 = svgEl('stop', { offset: '0%',   'stop-color': s.color, 'stop-opacity': '0.18' });
    const stop2 = svgEl('stop', { offset: '100%', 'stop-color': s.color, 'stop-opacity': '0.01' });
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
  });
  svg.appendChild(defs);

  // Target lines option: [{value, label, color}]
  const targetLines = opts.targetLines || [];

  // Per series: normalize
  series.forEach((s, si) => {
    const vals = s.values;
    // Include target values in first-series scale so they're always visible
    const allForScale = si === 0
      ? [...vals, ...targetLines.map(t => t.value)]
      : vals;
    const minV = Math.min(...allForScale) * 0.85;
    const maxV = Math.max(...allForScale) * 1.1;
    const range = maxV - minV || 1;

    const toX = i => pad.left + (i / (n - 1)) * chartW;
    const toY = v => pad.top + chartH - ((v - minV) / range) * chartH;

    const points = vals.map((v, i) => [toX(i), toY(v)]);
    const pathD  = smoothPath(points);

    // Y grid (only for first series)
    if (si === 0) {
      const steps = 4;
      for (let g = 0; g <= steps; g++) {
        // Round to 4 significant figures to eliminate float artifacts
        const yv = parseFloat((minV + (range * g / steps)).toPrecision(4));
        const gy = pad.top + chartH - (g / steps) * chartH;
        const line = svgEl('line', {
          x1: pad.left, y1: gy, x2: pad.left + chartW, y2: gy,
          stroke: SIERA_COLORS.border, 'stroke-width': '0.5',
          'stroke-dasharray': g === 0 ? '0' : '3 3',
        });
        svg.appendChild(line);
        const lbl = svgEl('text', {
          x: pad.left - 6, y: gy + 4,
          'text-anchor': 'end',
          'font-size': '10',
          fill: SIERA_COLORS.text3,
        });
        lbl.textContent = formatK(yv);
        svg.appendChild(lbl);
      }

      // X labels
      labels.forEach((lbl, i) => {
        const tx = toX(i);
        const line = svgEl('line', {
          x1: tx, y1: pad.top, x2: tx, y2: pad.top + chartH,
          stroke: SIERA_COLORS.border, 'stroke-width': '0.5',
        });
        svg.appendChild(line);
        const t = svgEl('text', {
          x: tx, y: pad.top + chartH + 14,
          'text-anchor': 'middle',
          'font-size': '10',
          fill: SIERA_COLORS.text2,
        });
        t.textContent = lbl;
        svg.appendChild(t);
      });
    }

    // Area fill
    const areaD = pathD + ` L ${points[n - 1][0]} ${pad.top + chartH} L ${points[0][0]} ${pad.top + chartH} Z`;
    const area  = svgEl('path', {
      d: areaD,
      fill: `url(#grad-${containerId}-${si})`,
      stroke: 'none',
    });
    svg.appendChild(area);

    // Line
    const path = svgEl('path', {
      d: pathD,
      fill: 'none',
      stroke: s.color,
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    // Animate draw
    const len = path.getTotalLength ? path.getTotalLength() : 1000;
    path.style.strokeDasharray  = len;
    path.style.strokeDashoffset = len;
    path.style.transition = 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)';
    svg.appendChild(path);
    requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });

    // Dots + tooltips
    points.forEach(([px, py], i) => {
      const g = svgEl('g', { style: 'cursor:pointer' });

      // Hover area
      const hitbox = svgEl('circle', { cx: px, cy: py, r: '10', fill: 'transparent' });
      g.appendChild(hitbox);

      // Dot
      const dot = svgEl('circle', {
        cx: px, cy: py, r: '4',
        fill: '#fff',
        stroke: s.color,
        'stroke-width': '2',
        style: 'transition: r 0.15s',
      });
      g.appendChild(dot);

      // Tooltip on hover
      const tipG    = svgEl('g', { opacity: '0', style: 'transition:opacity 0.15s;pointer-events:none' });
      const tipW    = 88;
      const tipH    = 32;
      const tipX    = Math.min(px - tipW / 2, W - tipW - 8);
      const tipY    = py - tipH - 8;
      const tipRect = svgEl('rect', {
        x: tipX, y: tipY, width: tipW, height: tipH,
        rx: '5', fill: '#0C0D0E',
      });
      const tipLabel = svgEl('text', {
        x: tipX + tipW / 2, y: tipY + 12,
        'text-anchor': 'middle', 'font-size': '10', fill: '#9EA1A8',
      });
      tipLabel.textContent = labels[i];
      const tipVal = svgEl('text', {
        x: tipX + tipW / 2, y: tipY + 24,
        'text-anchor': 'middle', 'font-size': '11',
        fill: '#fff', 'font-weight': '600',
      });
      tipVal.textContent = s.format ? s.format(s.values[i]) : formatK(s.values[i]);
      tipG.appendChild(tipRect);
      tipG.appendChild(tipLabel);
      tipG.appendChild(tipVal);
      g.appendChild(tipG);

      g.addEventListener('mouseenter', () => {
        dot.setAttribute('r', '6');
        tipG.setAttribute('opacity', '1');
      });
      g.addEventListener('mouseleave', () => {
        dot.setAttribute('r', '4');
        tipG.setAttribute('opacity', '0');
      });

      svg.appendChild(g);
    });

    // Target lines — drawn on top of each series (use first series scale)
    if (si === 0 && targetLines.length) {
      const minV0 = Math.min(...[...s.values, ...targetLines.map(t => t.value)]) * 0.85;
      const maxV0 = Math.max(...[...s.values, ...targetLines.map(t => t.value)]) * 1.1;
      const rng0  = maxV0 - minV0 || 1;
      const toY0  = v => pad.top + chartH - ((v - minV0) / rng0) * chartH;

      targetLines.forEach(tl => {
        const ty   = toY0(tl.value);
        const col  = tl.color || '#EF9F27';
        const tLine = svgEl('line', {
          x1: pad.left, y1: ty, x2: pad.left + chartW, y2: ty,
          stroke: col, 'stroke-width': '1.5',
          'stroke-dasharray': '5 4',
          opacity: '0.8',
        });
        svg.appendChild(tLine);

        // Label pill on right edge
        const tlBg = svgEl('rect', {
          x: pad.left + chartW - 48, y: ty - 9,
          width: 48, height: 16, rx: '4',
          fill: col, opacity: '0.15',
        });
        const tlTxt = svgEl('text', {
          x: pad.left + chartW - 24, y: ty + 4,
          'text-anchor': 'middle', 'font-size': '9.5',
          fill: col, 'font-weight': '600',
        });
        tlTxt.textContent = tl.label || formatK(tl.value);
        svg.appendChild(tlBg);
        svg.appendChild(tlTxt);
      });
    }
  });

  // Legend
  if (series.length > 1) {
    let lx = pad.left;
    series.forEach(s => {
      const lg = svgEl('g');
      const lc = svgEl('rect', { x: lx, y: H - 6, width: 8, height: 8, rx: '2', fill: s.color });
      const lt = svgEl('text', { x: lx + 11, y: H - 0, 'font-size': '10', fill: SIERA_COLORS.text2 });
      lt.textContent = s.label;
      lg.appendChild(lc);
      lg.appendChild(lt);
      svg.appendChild(lg);
      lx += 80;
    });
  }

  container.appendChild(svg);
}

/* ══════════════════════════════════════════
   BAR CHART
   ══════════════════════════════════════════ */
function renderBarChart(containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const labels = opts.labels || [];
  const series = opts.series || [];
  const H      = opts.height || 160;
  const W      = Math.max(container.clientWidth || 0, 320);
  const pad    = { top: 16, right: 16, bottom: 28, left: 52 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const n      = labels.length;
  const ns     = series.length;

  if (!n) return;

  const allVals = series.flatMap(s => s.values);
  const maxV    = Math.max(...allVals) * 1.15 || 1;
  const minV    = 0;

  const svg     = svgEl('svg', { width: W, height: H, style: 'display:block' });
  const slotW   = chartW / n;
  const gap     = 4;
  const barW    = (slotW - gap * (ns + 1)) / ns;

  const toY = v => pad.top + chartH - ((v - minV) / (maxV - minV)) * chartH;
  const toH = v => ((v - minV) / (maxV - minV)) * chartH;

  // Y grid
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    const v  = parseFloat((maxV * t).toPrecision(4));
    const gy = pad.top + chartH - t * chartH;
    const gl = svgEl('line', {
      x1: pad.left, y1: gy, x2: pad.left + chartW, y2: gy,
      stroke: SIERA_COLORS.border, 'stroke-width': '0.5',
      'stroke-dasharray': t === 0 ? '0' : '3 3',
    });
    svg.appendChild(gl);
    const gt = svgEl('text', {
      x: pad.left - 5, y: gy + 4,
      'text-anchor': 'end', 'font-size': '10', fill: SIERA_COLORS.text3,
    });
    gt.textContent = formatK(v);
    svg.appendChild(gt);
  });

  // Bars + labels
  labels.forEach((lbl, i) => {
    const baseX = pad.left + i * slotW + gap;

    // X label
    const xt = svgEl('text', {
      x: pad.left + i * slotW + slotW / 2,
      y: pad.top + chartH + 14,
      'text-anchor': 'middle', 'font-size': '10', fill: SIERA_COLORS.text2,
    });
    xt.textContent = lbl;
    svg.appendChild(xt);

    series.forEach((s, si) => {
      const v   = s.values[i] || 0;
      const bH  = toH(v);
      const bX  = baseX + si * (barW + gap);
      const bY  = pad.top + chartH - bH;

      const rect = svgEl('rect', {
        x: bX, y: pad.top + chartH, // animate from bottom
        width: barW, height: 0,
        rx: '3', fill: s.color, opacity: '0.85',
        style: 'transition: all 0.5s cubic-bezier(0.4,0,0.2,1)',
      });
      svg.appendChild(rect);
      setTimeout(() => {
        rect.setAttribute('y', bY);
        rect.setAttribute('height', bH);
      }, 80 + i * 40);

      // Hover tooltip
      rect.style.cursor = 'pointer';
      rect.addEventListener('mouseenter', e => {
        rect.setAttribute('opacity', '1');
        showChartTooltip(e, `${lbl}: ${s.format ? s.format(v) : formatK(v)}`);
      });
      rect.addEventListener('mouseleave', () => {
        rect.setAttribute('opacity', '0.85');
        hideChartTooltip();
      });
    });
  });

  // Legend
  let lx = pad.left;
  series.forEach(s => {
    const lc = svgEl('rect', { x: lx, y: H - 8, width: 8, height: 8, rx: '2', fill: s.color });
    const lt = svgEl('text', { x: lx + 11, y: H - 1, 'font-size': '10', fill: SIERA_COLORS.text2 });
    lt.textContent = s.label;
    svg.appendChild(lc);
    svg.appendChild(lt);
    lx += 80;
  });

  container.appendChild(svg);
}

/* ══════════════════════════════════════════
   DONUT CHART (Budget utilization)
   ══════════════════════════════════════════ */
function renderDonut(containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const segments = opts.segments || [];
  const size     = opts.size || 140;
  const stroke   = opts.stroke || 20;
  const R        = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * R;

  const svg = svgEl('svg', { width: size, height: size, style: 'display:block' });

  // Background ring
  const bg = svgEl('circle', {
    cx, cy, r: R,
    fill: 'none',
    stroke: '#F0F1F3',
    'stroke-width': stroke,
  });
  svg.appendChild(bg);

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = -Math.PI / 2; // start at top

  segments.forEach(seg => {
    const ratio = seg.value / total;
    const arc   = ratio * circ;
    const dashOffset = circ - arc;

    const circle = svgEl('circle', {
      cx, cy, r: R,
      fill: 'none',
      stroke: seg.color,
      'stroke-width': stroke - 2,
      'stroke-dasharray': `${arc} ${circ}`,
      'stroke-dashoffset': -(offset * R),
      'stroke-linecap': 'round',
      style: `transform: rotate(${offset * 180 / Math.PI + 90}deg); transform-origin: ${cx}px ${cy}px; transition: stroke-dasharray 0.7s ease`,
    });
    svg.appendChild(circle);
    offset += ratio * 2 * Math.PI;
  });

  // Center label
  if (opts.centerLabel) {
    const tVal = svgEl('text', {
      x: cx, y: cy + 2,
      'text-anchor': 'middle',
      'font-size': '16',
      'font-weight': '700',
      fill: '#0C0D0E',
    });
    tVal.textContent = opts.centerLabel;
    svg.appendChild(tVal);

    if (opts.centerSub) {
      const tSub = svgEl('text', {
        x: cx, y: cy + 16,
        'text-anchor': 'middle',
        'font-size': '9',
        fill: SIERA_COLORS.text3,
      });
      tSub.textContent = opts.centerSub;
      svg.appendChild(tSub);
    }
  }

  container.appendChild(svg);
}

/* ══════════════════════════════════════════
   SPARKLINE (mini inline chart)
   ══════════════════════════════════════════ */
function renderSparkline(containerId, values, color = '#1D9E75') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const W = 80, H = 28;
  const n = values.length;
  if (n < 2) return;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const toX = i => (i / (n - 1)) * W;
  const toY = v => H - 4 - ((v - minV) / range) * (H - 8);

  const points = values.map((v, i) => [toX(i), toY(v)]);
  const svg    = svgEl('svg', { width: W, height: H, style: 'display:block' });

  const line = svgEl('polyline', {
    points: points.map(p => p.join(',')).join(' '),
    fill: 'none',
    stroke: color,
    'stroke-width': '1.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  svg.appendChild(line);

  // Last dot
  const last = points[n - 1];
  const dot  = svgEl('circle', { cx: last[0], cy: last[1], r: '2.5', fill: color });
  svg.appendChild(dot);

  container.appendChild(svg);
}

/* ── Tooltip helper (floating DOM tooltip) ── */
let _tip = null;
function showChartTooltip(event, text) {
  if (!_tip) {
    _tip = document.createElement('div');
    _tip.style.cssText = `
      position:fixed;pointer-events:none;z-index:999;
      background:#0C0D0E;color:#fff;padding:5px 10px;
      font-size:12px;border-radius:6px;white-space:nowrap;
      font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(_tip);
  }
  _tip.textContent = text;
  _tip.style.display = 'block';
  _tip.style.left = (event.clientX + 12) + 'px';
  _tip.style.top  = (event.clientY - 16) + 'px';
}
function hideChartTooltip() {
  if (_tip) _tip.style.display = 'none';
}
document.addEventListener('mousemove', e => {
  if (_tip && _tip.style.display !== 'none') {
    _tip.style.left = (e.clientX + 12) + 'px';
    _tip.style.top  = (e.clientY - 16) + 'px';
  }
});

/* ══════════════════════════════════════════
   Init all charts
   ══════════════════════════════════════════ */
/* ── Real data from ERA_EXHIBITION_Sales_Input_2.xlsx ── */
window.CHART_LABELS_7D  = ['27/4', '28/4', '29/4', '30/4', '1/5', '2/5', '3/5'];

// Revenue harian (juta Rp) — source: INPUT DAILY Grand Total Value
window.CHART_REVENUE_7D = [387.8, 338.5, 153.2, 314.0, 357.2, 505.7, null];

// Total units terjual per hari — source: INPUT DAILY Grand Total Qty
window.CHART_UNITS_7D   = [55, 51, 25, 39, 72, 86, null];

// Device units per hari — source: Device Total Qty
window.CHART_DEVICE_7D  = [36, 24, 10, 13, 19, 43, null];

// VAS units per hari — source: VAS Total Qty
window.CHART_VAS_7D     = [19, 27, 15, 26, 53, 43, null];

// Daily achievement % vs daily target (6,156.7 jt / 7 = 879.5 jt/hari)
window.CHART_ACHIEV_7D  = [44.1, 38.5, 17.4, 35.7, 40.6, 57.5, null];

// VMD Score (manual — tidak ada di Excel, gunakan estimasi lapangan)
window.CHART_VMD_7D     = [90, 88, 91, 82, 89, 85, null];

function initCharts() {
  const labels6 = window.CHART_LABELS_7D.slice(0, 6);
  const rev6    = window.CHART_REVENUE_7D.filter(v => v !== null);
  const units6  = window.CHART_UNITS_7D.filter(v => v !== null);
  const device6 = window.CHART_DEVICE_7D.filter(v => v !== null);
  const vas6    = window.CHART_VAS_7D.filter(v => v !== null);
  const achiev6 = window.CHART_ACHIEV_7D.filter(v => v !== null);
  const vmd6    = window.CHART_VMD_7D.filter(v => v !== null);

  // Overview: dual-line — Revenue harian & Units terjual
  renderLineChart('chart-trend', {
    height: 180,
    labels: labels6,
    series: [
      {
        label:  'Revenue (jt Rp)',
        values: rev6,
        color:  SIERA_COLORS.teal,
        format: v => `Rp ${v} jt`,
      },
      {
        label:  'Units Terjual',
        values: units6,
        color:  SIERA_COLORS.blue,
        format: v => v + ' unit',
      },
    ],
    targetLines: [
      { value: 879.5, label: 'Target/hari 879 jt', color: SIERA_COLORS.amber },
    ],
  });

  // Overview: Daily Achievement % vs daily target
  renderLineChart('chart-conv', {
    height: 120,
    labels: labels6,
    series: [
      {
        label:  'Achievement (%)',
        values: achiev6,
        color:  SIERA_COLORS.violet,
        format: v => v + '%',
      },
    ],
    targetLines: [
      { value: 100, label: 'Target 100%', color: SIERA_COLORS.red },
    ],
  });

  // Daily tab: Device vs VAS units per hari
  renderBarChart('chart-daily-bar', {
    height: 160,
    labels: labels6,
    series: [
      {
        label:  'Device',
        values: device6,
        color:  SIERA_COLORS.teal,
      },
      {
        label:  'VAS',
        values: vas6,
        color:  SIERA_COLORS.blue,
      },
    ],
  });

  // Budget donut — plan amounts (Rp juta)
  // Venue & Booth 119.16 · SDM 6.5 · Media & Promosi 8.135
  renderDonut('chart-budget-donut', {
    size: 140,
    stroke: 22,
    centerLabel: 'Plan',
    centerSub: 'Rp 133,8 jt',
    segments: [
      { value: 85.0,  color: SIERA_COLORS.teal   },  // Konstruksi Booth
      { value: 34.16, color: SIERA_COLORS.blue   },  // Sewa Space + Deposit
      { value: 8.135, color: SIERA_COLORS.violet },  // Media, KOL, OOH
      { value: 6.5,   color: SIERA_COLORS.amber  },  // SDM / Personil
    ],
  });

  // Sparklines
  renderSparkline('spark-walkin',  units6,  SIERA_COLORS.teal);   // units sold
  renderSparkline('spark-revenue', rev6,    SIERA_COLORS.blue);
  renderSparkline('spark-conv',    achiev6, SIERA_COLORS.violet);  // achievement%
  renderSparkline('spark-vmd',     vmd6,    SIERA_COLORS.amber);
}

window.initCharts = initCharts;
window.renderLineChart = renderLineChart;
window.renderBarChart  = renderBarChart;
window.renderDonut     = renderDonut;
window.renderSparkline = renderSparkline;
