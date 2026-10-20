export function getDateRangePreset(preset) {
  const to = new Date();
  const from = new Date();
  if (preset === "7d") from.setDate(from.getDate() - 7);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else if (preset === "365d") from.setDate(from.getDate() - 365);
  else from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset: preset || "30d",
  };
}

export function formatSeriesLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function normalizeBarSeries(series = [], maxBars = 14) {
  const items = (series || []).slice(-maxBars);
  const max = Math.max(...items.map((s) => s.value || 0), 1);
  return items.map((s) => ({
    label: formatSeriesLabel(s.date),
    value: s.value || 0,
    height: Math.round(((s.value || 0) / max) * 100),
  }));
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
