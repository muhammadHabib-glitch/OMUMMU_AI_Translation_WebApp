import { timeAgo } from "../components/admin/analyticsUtils";

/**
 * Find a catalog language entry by label (case-insensitive, trims parentheticals for fallback).
 */
export function findLanguageByLabel(label, catalog) {
  const raw = String(label || "").trim();
  if (!raw) return null;
  const languages = catalog?.languages || [];
  const key = raw.toLowerCase();
  const exact = languages.find((l) => l.label?.toLowerCase() === key);
  if (exact) return exact;
  const stripped = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase();
  if (stripped !== key) {
    const byStripped = languages.find((l) => l.label?.toLowerCase() === stripped);
    if (byStripped) return byStripped;
  }
  const byCode = languages.find((l) => l.code?.toLowerCase() === key);
  if (byCode) return byCode;
  return null;
}

/**
 * Display code from catalog metadata (e.g. "en-gb" → "EN", "ig" → "IG").
 * Falls back to the raw label when no catalog match exists.
 */
export function langDisplayCode(label, catalog) {
  const lang = findLanguageByLabel(label, catalog);
  if (lang?.code) {
    return lang.code.split("-")[0].toUpperCase();
  }
  const raw = String(label || "").trim();
  if (/^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(raw)) {
    return raw.split("-")[0].toUpperCase();
  }
  return raw || "—";
}

export function historyDateGroup(createdAt) {
  if (!createdAt) return "EARLIER";
  const d = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfToday) return "TODAY";
  if (d >= startOfYesterday) return "YESTERDAY";
  return "EARLIER";
}

export function mapHistoryItem(row, catalog = null) {
  const sourceLangLabel = row.source_lang || "";
  const targetLangLabel = row.target_lang || "";
  const createdAt = row.created_at;
  const group = historyDateGroup(createdAt);
  return {
    id: row.id,
    source: row.source_text || "",
    translation: row.result_text || "",
    sourceLangLabel,
    targetLangLabel,
    from: langDisplayCode(sourceLangLabel, catalog),
    to: langDisplayCode(targetLangLabel, catalog),
    mode: row.mode || "text",
    favorite: Boolean(row.favorite),
    time: group === "YESTERDAY" ? "Yesterday" : timeAgo(createdAt),
    group,
    createdAt,
  };
}
