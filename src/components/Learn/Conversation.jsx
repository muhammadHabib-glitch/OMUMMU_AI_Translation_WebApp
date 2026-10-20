import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import AppLayout from "../AppLayout";
import {
  completeConversationSession,
  fetchConversationScenarios,
  fetchConversationSession,
  sendConversationMessage,
  startConversationSession,
} from "../../services/mockApi";
import "./Practice.css";

function FeedbackPanel({ feedback }) {
  if (!feedback) return null;
  const hasVocab = Array.isArray(feedback.vocabulary) && feedback.vocabulary.length > 0;
  if (!feedback.translation && !feedback.correction && !feedback.grammar && !hasVocab) {
    return null;
  }
  return (
    <div className="conv-feedback">
      {feedback.translation ? (
        <p>
          <strong>Translation:</strong> {feedback.translation}
        </p>
      ) : null}
      {feedback.correction ? (
        <p>
          <strong>Tip:</strong> {feedback.correction}
        </p>
      ) : null}
      {feedback.grammar ? (
        <p>
          <strong>Grammar:</strong> {feedback.grammar}
        </p>
      ) : null}
      {hasVocab ? (
        <ul className="conv-feedback__vocab">
          {feedback.vocabulary.map((v) => (
            <li key={`${v.term}-${v.meaning}`}>
              <strong>{v.term}</strong> — {v.meaning}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function Conversation() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState(null);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchConversationScenarios();
      setScenarios(res.scenarios || []);
    } catch (err) {
      setError(err?.message || "Unable to load conversation scenarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setCompleteResult(null);
    try {
      const data = await fetchConversationSession(id);
      setSession(data.session);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err?.message || "Unable to load conversation.");
      setSession(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
    else loadScenarios();
  }, [sessionId, loadSession, loadScenarios]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleStart(scenarioId) {
    setError("");
    setLoading(true);
    try {
      const data = await startConversationSession(scenarioId);
      navigate(`/learn/conversation?sessionId=${data.session.id}`);
    } catch (err) {
      setError(err?.message || "Unable to start conversation.");
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!sessionId || !draft.trim() || sending || session?.status !== "active") return;
    setSending(true);
    setError("");
    const text = draft.trim();
    setDraft("");
    try {
      const data = await sendConversationMessage(sessionId, text);
      setSession(data.session);
      setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
    } catch (err) {
      setDraft(text);
      setError(err?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    if (!sessionId || completing) return;
    setCompleting(true);
    setError("");
    try {
      const data = await completeConversationSession(sessionId);
      setSession(data.session);
      setMessages(data.messages || messages);
      setCompleteResult(data);
    } catch (err) {
      setError(err?.message || "Unable to complete conversation.");
    } finally {
      setCompleting(false);
    }
  }

  const isActive = session?.status === "active";
  const canComplete = Boolean(session?.canComplete);

  return (
    <AppLayout>
      <div className="practice-page page-container conv-page">
        <Link to="/learn" className="practice-back">
          <ArrowLeft size={18} />
          Back to Learn
        </Link>

        {!sessionId ? (
          <>
            <h1>Conversation Practice</h1>
            <p className="practice-page__sub">
              Text chat with an AI partner in Igbo. Pick a scenario to begin.
            </p>
            {loading ? <p>Loading scenarios…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}
            {!loading && !scenarios.length ? (
              <div className="learn-state learn-state--empty">
                <p>No scenarios yet. Enroll in Igbo first, then try again.</p>
              </div>
            ) : null}
            <ul className="practice-list">
              {scenarios.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="practice-list-item"
                    onClick={() => handleStart(s.id)}
                  >
                    <div>
                      <h2>{s.title}</h2>
                      <p>{s.description}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>{session?.scenario?.title || "Conversation"}</h1>
            <p className="practice-page__sub">
              {session?.scenario?.learnerGoal || "Practice real dialogue in Igbo."}
              {session
                ? ` · ${session.userTurnCount}/${session.minUserTurns || 3} turns`
                : ""}
            </p>
            {loading ? <p>Loading conversation…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}

            <div className="conv-chat" aria-live="polite">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`conv-bubble conv-bubble--${m.role}`}
                >
                  <p className="conv-bubble__text">{m.content}</p>
                  {m.role === "assistant" ? <FeedbackPanel feedback={m.feedback} /> : null}
                </div>
              ))}
              {sending ? <p className="conv-typing">Partner is typing…</p> : null}
              <div ref={bottomRef} />
            </div>

            {session?.status === "completed" || completeResult ? (
              <div className="conv-complete">
                <p>
                  Session complete
                  {completeResult && !completeResult.alreadyCompleted
                    ? ` · +${completeResult.xpAwarded} XP`
                    : completeResult?.alreadyCompleted
                      ? " · already credited"
                      : ""}
                </p>
                <div className="flashcard-actions">
                  <Link to="/learn/conversation" className="btn btn-outline">
                    New scenario
                  </Link>
                  <Link to="/learn" className="btn btn-primary">
                    Back to Learn
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <form className="conv-compose" onSubmit={handleSend}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your reply in Igbo or English…"
                    disabled={!isActive || sending}
                    aria-label="Conversation message"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!isActive || sending || !draft.trim()}
                  >
                    <Send size={16} />
                    Send
                  </button>
                </form>
                <div className="flashcard-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!canComplete || completing}
                    onClick={handleComplete}
                  >
                    {completing ? "Completing…" : "Complete session"}
                  </button>
                  <Link to="/learn/conversation" className="btn btn-outline">
                    Scenarios
                  </Link>
                </div>
                {!canComplete && isActive ? (
                  <p className="practice-page__sub">
                    Send at least {session?.minUserTurns || 3} messages to complete and earn XP.
                  </p>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
