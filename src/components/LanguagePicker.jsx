import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { fetchLanguages, getRecentLanguageCodes, rememberLanguage } from "../services/mockApi";
import LanguageFlag from "./LanguageFlag";

const RECENT_KEY = "omummu_recent_langs";

export function getDefaultLanguages(catalog) {
  const list = catalog?.languages || [];
  const source =
    list.find((l) => l.code === "en-gb") ||
    list.find((l) => l.code === "en") ||
    list[0];
  const target =
    list.find((l) => l.code === "ig") ||
    list.find((l) => l.priority) ||
    list[1];
  return { source, target };
}

function sortForPicker(languages, recentCodes, query, allowAuto) {
  const q = query.trim().toLowerCase();
  const filtered = languages.filter((l) => {
    if (!allowAuto && l.detectOnly) return false;
    if (!q) return true;
    return (
      l.label.toLowerCase().includes(q) ||
      (l.nativeName && l.nativeName.toLowerCase().includes(q)) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const recentSet = new Set(recentCodes);
  const priority = filtered.filter((l) => l.priority && !recentSet.has(l.code));
  const recent = recentCodes
    .map((code) => filtered.find((l) => l.code === code))
    .filter(Boolean);
  const rest = filtered.filter((l) => !l.priority && !recentSet.has(l.code));

  return { recent, priority, rest };
}

export default function LanguagePicker({
  language,
  onChange,
  allowAutoDetect = false,
  autoDetectOption = null,
  disabled = false,
  ariaLabel = "Select language",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [recentCodes, setRecentCodes] = useState(() => getRecentLanguageCodes());
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchLanguages().then((data) => {
      if (active) setCatalog(data);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const languages = useMemo(() => {
    const base = catalog?.languages ? [...catalog.languages] : [];
    if (allowAutoDetect && autoDetectOption) {
      return [autoDetectOption, ...base];
    }
    return base;
  }, [catalog, allowAutoDetect, autoDetectOption]);

  const sections = useMemo(
    () => sortForPicker(languages, recentCodes, query, allowAutoDetect),
    [languages, recentCodes, query, allowAutoDetect]
  );

  const selectLanguage = (lang) => {
    if (lang.detectOnly && !allowAutoDetect) return;
    rememberLanguage(lang.code);
    setRecentCodes(getRecentLanguageCodes());
    onChange(lang);
    setOpen(false);
    setQuery("");
  };

  const display = language || { label: "Loading…", flag: "🌐" };

  const renderSection = (title, items) => {
    if (!items.length) return null;
    return (
      <>
        <li className="lang-section-label">{title}</li>
        {items.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              role="option"
              aria-selected={l.code === display.code}
              className={`lang-option ${l.code === display.code ? "is-selected" : ""}`}
              onClick={() => selectLanguage(l)}
            >
              <LanguageFlag
                countryCode={l.countryCode}
                detectOnly={l.detectOnly}
                size="sm"
              />
              <span className="lang-option-text">
                <span>{l.label}</span>
                {l.nativeName && l.nativeName !== l.label && (
                  <span className="lang-native">{l.nativeName}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </>
    );
  };

  return (
    <div className="lang-select" ref={ref}>
      <button
        type="button"
        className="lang-pill"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <LanguageFlag
          countryCode={display.countryCode}
          detectOnly={display.detectOnly}
          size="md"
        />
        <span className="lang-label">{display.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="lang-dropdown-panel">
          <div className="lang-search-wrap">
            <Search size={16} aria-hidden />
            <input
              ref={searchRef}
              type="search"
              className="lang-search-input"
              placeholder="Search languages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search languages"
            />
          </div>
          <ul className="lang-dropdown" role="listbox">
            {renderSection("Recent", sections.recent)}
            {renderSection("African languages (priority)", sections.priority)}
            {renderSection(
              sections.recent.length || sections.priority.length ? "All languages" : null,
              sections.rest
            )}
            {!sections.recent.length &&
              !sections.priority.length &&
              !sections.rest.length && (
                <li className="lang-empty">No languages match your search.</li>
              )}
          </ul>
        </div>
      )}
    </div>
  );
}

export { RECENT_KEY };
