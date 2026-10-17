window.RL = window.RL || {};

RL.todayISO = function todayISO() {
  return new Date().toISOString().slice(0, 10);
};

RL.formatDate = function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

RL.sortedHistory = function sortedHistory(history) {
  return [...(history || [])].sort((a, b) => a.date.localeCompare(b.date));
};

RL.getTrend = function getTrend(history) {
  const h = RL.sortedHistory(history);
  if (h.length < 2) return { direction: "flat", delta: 0 };
  const last = h[h.length - 1].position;
  const prev = h[h.length - 2].position;
  const delta = prev - last;
  if (delta > 0) return { direction: "up", delta };
  if (delta < 0) return { direction: "down", delta: Math.abs(delta) };
  return { direction: "flat", delta: 0 };
};

RL.currentPosition = function currentPosition(history) {
  const h = RL.sortedHistory(history);
  return h.length ? h[h.length - 1].position : null;
};

RL.bestPosition = function bestPosition(history) {
  if (!history || !history.length) return null;
  return Math.min(...history.map((h) => h.position));
};

RL.esc = function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
};

RL.icon = function icon(name, size, color) {
  const s = size || 15;
  const c = color || "currentColor";
  const paths = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    chevronDown: '<polyline points="6 9 12 15 18 9"/>',
    chevronUp: '<polyline points="18 15 12 9 6 15"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    trash2:
      '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    logOut:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    calendarPlus:
      '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/>',
    trendingUp:
      '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    trendingDown:
      '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
  };
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${paths[name] || ""}</svg>`;
};

/** Build daily series: last-known position per keyword per day, then average. */
RL.buildDashboardSeries = function buildDashboardSeries(entries, maxDays) {
  const days = maxDays || 30;
  if (!entries || !entries.length) return [];

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const perKeyword = entries.map((e) => {
    const h = RL.sortedHistory(e.history);
    return h;
  });

  return dates.map((date) => {
    const positions = [];
    perKeyword.forEach((h) => {
      let last = null;
      for (let i = 0; i < h.length; i++) {
        if (h[i].date <= date) last = h[i].position;
        else break;
      }
      if (last != null) positions.push(last);
    });
    if (!positions.length) return { date, avg: null };
    const avg = positions.reduce((a, b) => a + b, 0) / positions.length;
    return { date, avg: Math.round(avg * 10) / 10 };
  }).filter((p) => p.avg != null);
};
