import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Star,
  Type,
  Mic,
  Camera,
  FileText,
  Clock,
  Languages,
  Heart,
  Trash2,
  Loader2,
} from "lucide-react";
import AppLayout from "./AppLayout";
import {
  fetchHistory,
  fetchLanguages,
  toggleHistoryFavorite,
  deleteHistoryItem,
} from "../services/mockApi";
import { mapHistoryItem } from "../utils/historyUtils";
import "./History.css";

const FILTERS = [
  { id: "All", label: "All" },
  { id: "Favorites", label: "Favorites" },
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
  { id: "camera", label: "Camera" },
  { id: "document", label: "Document" },
];

const MODE_ICONS = {
  text: Type,
  voice: Mic,
  camera: Camera,
  document: FileText,
};

const GROUP_ORDER = ["TODAY", "YESTERDAY"];

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [historyData, langCatalog] = await Promise.all([fetchHistory(), fetchLanguages()]);
      const mapped = (historyData.items || []).map((row) => mapHistoryItem(row, langCatalog));
      setItems(mapped);
    } catch (err) {
      setError(err?.message || "Unable to load history.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const toggleFavorite = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item || busyId) return;
    const next = !item.favorite;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: next } : i)));
    setBusyId(id);
    try {
      await toggleHistoryFavorite(id, next);
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !next } : i)));
      setError(err?.message || "Could not update favorite.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (busyId) return;
    if (!window.confirm("Delete this translation from your history?")) return;
    setBusyId(id);
    setError("");
    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err?.message || "Could not delete translation.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.source.toLowerCase().includes(q) ||
        item.translation.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Favorites" && item.favorite) ||
        item.mode === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, activeFilter]);

  const groups = useMemo(() => {
    const map = {};
    filtered.forEach((item) => {
      const key = item.group || "EARLIER";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    const ordered = GROUP_ORDER.filter((g) => map[g]?.length).map((g) => [g, map[g]]);
    Object.keys(map)
      .filter((g) => !GROUP_ORDER.includes(g))
      .forEach((g) => ordered.push([g, map[g]]));
    return ordered;
  }, [filtered]);

  const favoriteCount = items.filter((i) => i.favorite).length;
  const languageCount = new Set(items.map((i) => i.targetLangLabel).filter(Boolean)).size;

  return (
    <AppLayout>
      <div className="history-page page-container">
        <header className="history-header">
          <div>
            <h1>History</h1>
            <p>Review and manage your past translations</p>
          </div>
        </header>

        <div className="history-toolbar">
          <div className="history-search">
            <Search size={18} className="history-search__icon" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search your history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search history"
            />
          </div>

          <div className="history-filters" role="tablist" aria-label="History filters">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === filter.id}
                className={`history-filter${activeFilter === filter.id ? " is-active" : ""}`}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="history-error">
            {error}{" "}
            <button type="button" className="history-retry" onClick={loadHistory}>
              Retry
            </button>
          </p>
        )}

        <div className="history-stats">
          <div className="history-stat">
            <span className="history-stat__icon">
              <Clock size={20} />
            </span>
            <div>
              <div className="history-stat__value">{loading ? "—" : items.length}</div>
              <div className="history-stat__label">Translations</div>
            </div>
          </div>
          <div className="history-stat">
            <span className="history-stat__icon history-stat__icon--accent">
              <Heart size={20} />
            </span>
            <div>
              <div className="history-stat__value">{loading ? "—" : favoriteCount}</div>
              <div className="history-stat__label">Favorites</div>
            </div>
          </div>
          <div className="history-stat">
            <span className="history-stat__icon">
              <Languages size={20} />
            </span>
            <div>
              <div className="history-stat__value">{loading ? "—" : languageCount}</div>
              <div className="history-stat__label">Languages</div>
            </div>
          </div>
        </div>

        {loading && (
          <p className="history-loading">
            <Loader2 size={18} className="spin-inline" aria-hidden="true" /> Loading history…
          </p>
        )}

        <div className="history-groups">
          {!loading && items.length === 0 && !error && (
            <div className="history-empty">
              <p>No translations yet. Start translating!</p>
            </div>
          )}

          {!loading && items.length > 0 && groups.length === 0 && (
            <div className="history-empty">
              <p>No translations match your search or filters.</p>
            </div>
          )}

          {groups.map(([group, rows]) => (
            <section key={group} className="history-group">
              <h2 className="history-group__label">{group}</h2>
              <div className="history-list">
                {rows.map((item) => {
                  const ModeIcon = MODE_ICONS[item.mode] || Type;
                  const rowBusy = busyId === item.id;
                  return (
                    <article key={item.id} className="history-row">
                      <span className={`history-row__mode mode-${item.mode}`} aria-hidden="true">
                        <ModeIcon size={18} />
                      </span>
                      <div className="history-row__text">
                        <div className="history-row__source">{item.source}</div>
                        <div className="history-row__translation">{item.translation}</div>
                      </div>
                      <span className="history-row__pair">
                        {item.from}→{item.to}
                      </span>
                      <button
                        type="button"
                        className={`history-row__star${item.favorite ? " is-fav" : ""}`}
                        onClick={() => toggleFavorite(item.id)}
                        disabled={rowBusy}
                        aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star size={18} fill={item.favorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        className="history-row__delete"
                        onClick={() => handleDelete(item.id)}
                        disabled={rowBusy}
                        aria-label="Delete translation"
                      >
                        <Trash2 size={18} />
                      </button>
                      <time className="history-row__time">{item.time}</time>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
