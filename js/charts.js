window.RL = window.RL || {};

RL.renderSparkline = function renderSparkline(history, trendDirection) {
  const h = RL.sortedHistory(history);
  const width = 148;
  const height = 42;
  const padX = 4;
  const padY = 6;
  const color =
    trendDirection === "up"
      ? "var(--rise)"
      : trendDirection === "down"
        ? "var(--fall)"
        : "var(--ink-faint)";

  if (h.length < 2) {
    return `<svg width="${width}" height="${height}" style="flex-shrink:0" aria-hidden="true">
      <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="3 4"/>
      ${h.length === 1 ? `<circle cx="${width - padX}" cy="${height / 2}" r="3.5" fill="var(--teal)"/>` : ""}
    </svg>`;
  }

  const positions = h.map((p) => p.position);
  const minP = Math.min(...positions);
  const maxP = Math.max(...positions);
  const range = maxP - minP || 1;
  const points = h.map((p, i) => {
    const x = padX + (i / (h.length - 1)) * (width - padX * 2);
    const norm = (p.position - minP) / range;
    const y = padY + norm * (height - padY * 2);
    return { x, y };
  });
  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const areaD =
    pathD +
    ` L${last.x.toFixed(1)},${height - 2} L${points[0].x.toFixed(1)},${height - 2} Z`;

  return `<svg width="${width}" height="${height}" style="flex-shrink:0" aria-hidden="true">
    <path d="${areaD}" fill="${color}" opacity="0.12"/>
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x}" cy="${last.y}" r="3.4" fill="${color}"/>
  </svg>`;
};

RL.renderDashboardChart = function renderDashboardChart(series) {
  const width = 560;
  const height = 200;
  const padX = 36;
  const padY = 28;

  if (!series || series.length < 2) {
    return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Not enough data for chart yet">
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="var(--ink-faint)" font-size="14" font-family="Outfit, sans-serif">Log a few positions to see movement</text>
    </svg></div>`;
  }

  const values = series.map((s) => s.avg);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const points = series.map((s, i) => {
    const x = padX + (i / (series.length - 1)) * (width - padX * 2);
    const norm = (s.avg - minV) / range;
    const y = padY + norm * (height - padY * 2);
    return { x, y, ...s };
  });

  const pathD = points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const improved = last.avg < first.avg;
  const stroke = improved ? "var(--rise)" : "var(--fall)";
  const gradId = "rankArea";
  const areaD =
    pathD +
    ` L${last.x.toFixed(1)},${height - 8} L${first.x.toFixed(1)},${height - 8} Z`;

  const gridYs = [padY, height / 2, height - padY];
  const grids = gridYs
    .map(
      (y) =>
        `<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 6"/>`
    )
    .join("");

  return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Average rank over time">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${stroke}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grids}
    <path class="chart-area" d="${areaD}" fill="url(#${gradId})"/>
    <path class="chart-path" d="${pathD}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x}" cy="${last.y}" r="5" fill="${stroke}" stroke="#fff" stroke-width="2"/>
    <text x="${padX}" y="18" fill="var(--ink-faint)" font-size="11" font-family="JetBrains Mono, monospace">#${first.avg}</text>
    <text x="${width - padX}" y="18" text-anchor="end" fill="var(--ink)" font-size="11" font-family="JetBrains Mono, monospace" font-weight="600">#${last.avg}</text>
  </svg></div>`;
};
