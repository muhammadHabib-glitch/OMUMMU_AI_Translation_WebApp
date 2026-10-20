import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import AppLayout from "../AppLayout";
import { fetchCourses, fetchFlashcardDeck, fetchFlashcardDecks, reviewFlashcard } from "../../services/mockApi";
import "./Practice.css";

export default function Flashcards() {
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deckId");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decks, setDecks] = useState([]);
  const [deckData, setDeckData] = useState(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const coursesRes = await fetchCourses();
      const igbo = (coursesRes.courses || []).find((c) => c.slug === "igbo");
      const res = await fetchFlashcardDecks(igbo?.id);
      setDecks(res.decks || []);
    } catch (err) {
      setError(err?.message || "Unable to load flashcard decks.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeck = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setRevealed(false);
    setIndex(0);
    try {
      const data = await fetchFlashcardDeck(id);
      setDeckData(data);
    } catch (err) {
      setError(err?.message || "Unable to load deck.");
      setDeckData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (deckId) loadDeck(deckId);
    else loadDecks();
  }, [deckId, loadDeck, loadDecks]);

  const cards = deckData?.cards || [];
  const card = cards[index];

  async function handleReview(result) {
    if (!card) return;
    setReviewing(true);
    try {
      const res = await reviewFlashcard(card.id, { result });
      setDeckData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cards: prev.cards.map((c) => (c.id === card.id ? res.card : c)),
        };
      });
      setRevealed(false);
      setIndex((i) => Math.min(i + 1, Math.max(cards.length - 1, 0)));
    } catch (err) {
      setError(err?.message || "Unable to save review.");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <AppLayout>
      <div className="practice-page page-container">
        <Link to="/learn" className="practice-back">
          <ArrowLeft size={18} />
          Back to Learn
        </Link>

        {!deckId ? (
          <>
            <h1>Flashcards</h1>
            <p className="practice-page__sub">Review Igbo vocabulary from your unlocked lessons.</p>
            {loading ? <p>Loading decks…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}
            {!loading && !decks.length ? (
              <div className="learn-state learn-state--empty">
                <p>No flashcard decks yet. Enroll in Igbo and unlock a lesson first.</p>
              </div>
            ) : null}
            <ul className="practice-list">
              {decks.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`practice-list-item${d.locked ? " is-locked" : ""}`}
                    onClick={() => !d.locked && navigate(`/learn/flashcards?deckId=${d.id}`)}
                  >
                    <div>
                      <h2>{d.title}</h2>
                      <p>{d.cardCount} cards{d.locked ? " · Locked" : ""}</p>
                    </div>
                    {d.locked ? <Lock size={18} /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>{deckData?.deck?.title || "Flashcards"}</h1>
            <p className="practice-page__sub">
              Tap the card to reveal the translation. Mark correct or incorrect to save progress.
            </p>
            {loading ? <p>Loading…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}
            {!loading && card ? (
              <>
                <div
                  className="flashcard-stage"
                  onClick={() => setRevealed(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setRevealed(true)}
                >
                  <span className="flashcard-stage__hint">{revealed ? "Answer" : "Tap to reveal"}</span>
                  <div className="flashcard-stage__front">{card.front}</div>
                  {card.phonetic ? <div className="flashcard-stage__phonetic">{card.phonetic}</div> : null}
                  {revealed ? (
                    <>
                      <div className="flashcard-stage__back">{card.back}</div>
                      {card.exampleSentence ? <p>{card.exampleSentence}</p> : null}
                    </>
                  ) : null}
                </div>
                <div className="flashcard-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!revealed || reviewing}
                    onClick={() => handleReview("incorrect")}
                  >
                    Incorrect
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!revealed || reviewing}
                    onClick={() => handleReview("correct")}
                  >
                    Correct
                  </button>
                </div>
                <div className="flashcard-nav">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={index === 0}
                    onClick={() => {
                      setIndex((i) => Math.max(0, i - 1));
                      setRevealed(false);
                    }}
                  >
                    Previous
                  </button>
                  <span>
                    {index + 1} / {cards.length}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={index >= cards.length - 1}
                    onClick={() => {
                      setIndex((i) => Math.min(cards.length - 1, i + 1));
                      setRevealed(false);
                    }}
                  >
                    Next
                  </button>
                </div>
                <p className="practice-page__sub" style={{ marginTop: 16 }}>
                  Reviewed {card.progress?.timesCorrect || 0} correct · {card.progress?.timesIncorrect || 0}{" "}
                  incorrect
                </p>
                <Link to="/learn/flashcards" className="btn btn-outline">
                  All decks
                </Link>
              </>
            ) : null}
          </>
        )}
      </div>
    </AppLayout>
  );
}
