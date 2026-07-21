import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ArrowLeftRight,
  FileText,
  Mic,
  FileStack,
  Camera,
  Copy,
  Volume2,  
  Star,
  Share2,
  History,
  Check,
} from "lucide-react";
import "./Translate.css";
import Footer from "./Footer";
import Navbar from "./Navbar";

// PRD ref: Text-to-Text Translation (Core Translation Features)
// + shortcuts into Voice / Image / Document translation + AI Assistant
// + "Recent" translation history list.

const LANGUAGES = [
  { code: "en-uk", countryCode: "GB", label: "English (UK)", flag: "🇬🇧", swatch: "#2563EB" },
  { code: "ig", countryCode: "NG", label: "Igbo", flag: "🇳🇬", swatch: "#16A34A" },
  { code: "yo", countryCode: "NG", label: "Yoruba", flag: "🇳🇬", swatch: "#EA580C" },
  { code: "ha", countryCode: "NG", label: "Hausa", flag: "🇳🇬", swatch: "#7C3AED" },
  { code: "sw", countryCode: "KE", label: "Swahili", flag: "🇰🇪", swatch: "#DB2777" },
  { code: "am", countryCode: "ET", label: "Amharic", flag: "🇪🇹", swatch: "#059669" },
  { code: "zu", countryCode: "ZA", label: "Zulu", flag: "🇿🇦", swatch: "#CA8A04" },
  { code: "af", countryCode: "ZA", label: "Afrikaans", flag: "🇿🇦", swatch: "#0891B2" },
  { code: "fr", countryCode: "FR", label: "French", flag: "🇫🇷", swatch: "#0891B2" },
  { code: "de", countryCode: "DE", label: "German", flag: "🇩🇪", swatch: "#334155" },
  { code: "es", countryCode: "ES", label: "Spanish", flag: "🇪🇸", swatch: "#DC2626" },
];

const MODES = [
  { id: "text", label: "Text", icon: FileText },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "document", label: "Document", icon: FileStack },
  { id: "camera", label: "Camera", icon: Camera },
];

const RECENT_TRANSLATIONS = [
  { id: 1, text: "Hello, how are you today?", from: "English", to: "Yoruba" },
  { id: 2, text: "Good morning, family.", from: "English", to: "Swahili" },
  { id: 3, text: "Welcome to Lagos.", from: "English", to: "Hausa" },
];

const FEATURE_SHORTCUTS = [
  {
    id: "voice",
    icon: Mic,
    title: "Voice Translation",
    description: "Real-time speech to text conversion.",
  },
  {
    id: "image",
    icon: Camera,
    title: "Image to Text",
    description: "Translate from photos and docs.",
  },
  {
    id: "assistant",
    icon: BrainIcon,
    title: "AI Context Assistant",
    description: "Refine and perfect your meaning.",
  },
];

function BrainIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08A3 3 0 0 1 3 13.5a3 3 0 0 1 .34-5.63A2.5 2.5 0 0 1 5 4.5a2.5 2.5 0 0 1 2.5-2.5" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08A3 3 0 0 0 21 13.5a3 3 0 0 0-.34-5.63A2.5 2.5 0 0 0 19 4.5a2.5 2.5 0 0 0-2.5-2.5" />
    </svg>
  );
}

// Language pill (flag + country code + name) with attached dropdown list.
function LanguageSelect({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="lang-select" ref={ref}>
      <button
        type="button"
        className="lang-pill"
        style={{ borderColor: `${language.swatch}55` }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lang-flag">{language.flag}</span>
        <span className="lang-code">{language.countryCode}</span>
        <span className="lang-label">{language.label}</span>
        <ChevronDown size={16} className="lang-chevron" />
      </button>

      {open && (
        <ul className="lang-dropdown" role="listbox">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === language.code}
                className={`lang-option ${l.code === language.code ? "is-selected" : ""}`}
                onClick={() => {
                  onChange(l);
                  setOpen(false);
                }}
              >
                <span className="lang-flag">{l.flag}</span>
                <span className="lang-code">{l.countryCode}</span>
                <span>{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconAction({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`icon-action ${active ? "is-active" : ""}`}
    >
      <Icon size={18} />
    </button>
  );
}

// Replace with a real translation API call.
function mockTranslate(text, targetLabel) {
  if (!text.trim()) return "";
  return `[${targetLabel}] ${text}`;
}

export default function TranslateScreen() {
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]);
  const [detectLanguage, setDetectLanguage] = useState(false);
  const [activeMode, setActiveMode] = useState("text");
  const [sourceText, setSourceText] = useState("");
  const [translation, setTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent] = useState(RECENT_TRANSLATIONS);
  const maxChars = 5000;
  const textareaRef = useRef(null);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translation);
    setTranslation(sourceText);
  };

  const handleTranslate = useCallback(() => {
    if (!sourceText.trim() || isTranslating) return;
    setIsTranslating(true);
    setIsFavorited(false);
    setTimeout(() => {
      setTranslation(mockTranslate(sourceText, targetLang.label));
      setIsTranslating(false);
    }, 500);
  }, [sourceText, targetLang, isTranslating]);

  const handleClear = () => {
    setSourceText("");
    setTranslation("");
    textareaRef.current?.focus();
  };

  const handleCopy = async () => {
    if (!translation) return;
    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard denied — no-op */
    }
  };

  const handleSpeak = () => {
    if (!translation) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(translation));
    }
  };

  const handleShare = async () => {
    if (!translation) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: translation });
      } catch {
        /* share cancelled — no-op */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div>
          <Navbar/>
    <div className="translate-scroll">
    <div className="translate-page">
      <div className="translate-header">
        <h1>Translate with precision</h1>
        <p>
          100+ languages including Igbo, Yoruba, Hausa, and Swahili. Powered
          by high-fidelity linguistic AI models.
        </p>
      </div>

      <div className="translate-card">
        <div className="translate-toolbar">
          <div className="lang-row">
            <LanguageSelect language={sourceLang} onChange={setSourceLang} />
            <button
              type="button"
              className="swap-btn"
              aria-label="Swap languages"
              onClick={handleSwapLanguages}
            >
              <ArrowLeftRight size={18} />
            </button>
            <LanguageSelect language={targetLang} onChange={setTargetLang} />
          </div>

          <label className="detect-toggle">
            Detect language
            <button
              type="button"
              role="switch"
              aria-checked={detectLanguage}
              onClick={() => setDetectLanguage((v) => !v)}
              className={`switch ${detectLanguage ? "is-on" : ""}`}
            >
              <span className="switch-thumb" />
            </button>
          </label>
        </div>

        <div className="translate-panes">
          <div className="pane">
            <span className="pane-label">SOURCE</span>
            <textarea
              ref={textareaRef}
              value={sourceText}
              maxLength={maxChars}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or paste text here..."
              className="pane-textarea"
            />
            <div className="pane-footer">
              <span className="char-count">
                {sourceText.length} / {maxChars}
              </span>
              <button type="button" className="clear-link" onClick={handleClear}>
                Clear text
              </button>
            </div>
          </div>

          <div className="pane pane-translation">
            <span className="pane-label">TRANSLATION</span>
            <div className="translation-output">
              {isTranslating ? (
                <span className="placeholder">Translating…</span>
              ) : translation ? (
                <p>{translation}</p>
              ) : (
                <span className="placeholder italic">
                  Translation will appear here...
                </span>
              )}
            </div>
            <div className="pane-footer pane-footer-actions">
              <IconAction
                icon={copied ? Check : Copy}
                label="Copy translation"
                onClick={handleCopy}
                active={copied}
              />
              <IconAction icon={Volume2} label="Listen" onClick={handleSpeak} />
              <IconAction
                icon={Star}
                label="Save to favorites"
                onClick={() => setIsFavorited((v) => !v)}
                active={isFavorited}
              />
              <IconAction icon={Share2} label="Share" onClick={handleShare} />
            </div>
          </div>
        </div>

        <div className="translate-actions">
          <div className="mode-tabs">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveMode(mode.id)}
                  className={`mode-tab ${isActive ? "is-active" : ""}`}
                >
                  <Icon size={16} />
                  {mode.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating}
            className="translate-btn"
          >
            {isTranslating ? "Translating…" : "Translate"}
          </button>
        </div>
      </div>

      {/* Quick Features Grid */}
      <div className="shortcut-grid">
        {FEATURE_SHORTCUTS.map((feature) => {
          const Icon = feature.icon;
          return (
            <button key={feature.id} type="button" className="shortcut-card">
              <span className="shortcut-icon">
                <Icon size={20} />
              </span>
              <span className="shortcut-text">
                <span className="shortcut-title">{feature.title}</span>
                <span className="shortcut-desc">{feature.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Recent Section */}
      <div className="recent-card">
        <div className="recent-header">
          <span>Recent</span>
          <button type="button" className="view-all">
            View all
          </button>
        </div>
        <ul className="recent-list">
          {recent.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="recent-item"
                onClick={() => {
                  setSourceText(item.text);
                  setTranslation("");
                }}
              >
                <History size={18} className="recent-icon" />
                <span>
                  <span className="recent-text">{item.text}</span>
                  <span className="recent-meta">
                    {item.from} → {item.to}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
    </div>
    <Footer/>
    </div>
  );
}