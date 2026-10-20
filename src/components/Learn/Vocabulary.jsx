import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookMarked, Trash2 } from "lucide-react";
import AppLayout from "../AppLayout";
import {
  deleteSavedVocabulary,
  fetchSavedVocabulary,
  reviewSavedVocabulary,
  updateSavedVocabulary,
} from "../../services/mockApi";
import "./Vocabulary.css";

const MASTERY_LABELS = ["New", "Learning", "Familiar", "Known", "Strong", "Mastered"];

export default function Vocabulary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSavedVocabulary();
      setItems(data.items || []);
    } catch (err) {
      setError(err?.message || "Unable to load your dictionary.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleNotesBlur(item, value) {
    if ((item.notes || "") === value) return;
    setSavingId(item.id);
    try {
      const res = await updateSavedVocabulary(item.id, { notes: value });
      setItems((prev) => prev.map((row) => (row.id === item.id ? res.item : row)));
    } catch (err) {
      setError(err?.message || "Unable to save notes.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleMastery(item, masteryLevel) {
    setSavingId(item.id);
    try {
      const res = await reviewSavedVocabulary({ id: item.id, masteryLevel });
      setItems((prev) => prev.map((row) => (row.id === item.id ? res.item : row)));
    } catch (err) {
      setError(err?.message || "Unable to update mastery.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(item) {
    setSavingId(item.id);
    try {
      await deleteSavedVocabulary(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err?.message || "Unable to remove word.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppLayout>
      <div className="vocabulary-page page-container">
        <div className="vocabulary-page__nav">
          <Link to="/learn" className="vocabulary-back">
            <ArrowLeft size={18} />
            Back to Learn
          </Link>
        </div>

        <header className="vocabulary-header">
          <div>
            <h1>
              <BookMarked size={28} />
              Personal Dictionary
            </h1>
            <p>Words you save from lessons, with your notes and review progress.</p>
          </div>
          <span className="vocabulary-count">{items.length} saved</span>
        </header>

        {error ? (
          <div className="learn-state learn-state--error learn-state--inline">
            <p>{error}</p>
            <button type="button" className="btn btn-outline" onClick={load}>
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="learn-state learn-state--loading">
            <p>Loading your dictionary…</p>
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="learn-state learn-state--empty">
            <p>No saved words yet. Open an Igbo lesson and tap Save word on vocabulary cards.</p>
            <Link to="/learn" className="btn btn-primary">
              Go to Learn
            </Link>
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <ul className="vocabulary-list">
            {items.map((item) => (
              <li key={item.id} className="vocabulary-card">
                <div className="vocabulary-card__top">
                  <div>
                    <h2>{item.word}</h2>
                    {item.phonetic ? <div className="vocabulary-card__phonetic">{item.phonetic}</div> : null}
                    <div className="vocabulary-card__translation">{item.translation}</div>
                    {item.exampleSentence ? (
                      <p className="vocabulary-card__example">{item.exampleSentence}</p>
                    ) : null}
                    <div className="vocabulary-card__meta">
                      {item.languageCode || "—"} · {item.source}
                      {item.isManual ? " · manual" : " · from catalog"}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="vocabulary-remove"
                    aria-label={`Remove ${item.word}`}
                    disabled={savingId === item.id}
                    onClick={() => handleRemove(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <label className="vocabulary-notes-label">
                  Notes
                  <textarea
                    className="vocabulary-notes"
                    defaultValue={item.notes || ""}
                    key={`${item.id}-${item.updatedAt || ""}-notes`}
                    rows={2}
                    placeholder="Add a personal note…"
                    onBlur={(e) => handleNotesBlur(item, e.target.value)}
                  />
                </label>

                <div className="vocabulary-mastery">
                  <span>Mastery</span>
                  <div className="vocabulary-mastery__options">
                    {MASTERY_LABELS.map((label, level) => (
                      <button
                        key={label}
                        type="button"
                        className={`vocabulary-mastery__btn${item.masteryLevel === level ? " is-active" : ""}`}
                        disabled={savingId === item.id}
                        onClick={() => handleMastery(item, level)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </AppLayout>
  );
}
