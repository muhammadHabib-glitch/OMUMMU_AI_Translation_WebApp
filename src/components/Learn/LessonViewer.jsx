import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Lightbulb, Lock, MessageSquare } from "lucide-react";
import AppLayout from "../AppLayout";
import SaveWordButton from "./SaveWordButton";
import {
  completeLesson,
  fetchLesson,
  startLesson,
} from "../../services/mockApi";
import "./LessonViewer.css";
import "./Vocabulary.css";

function renderInlineMarkdown(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function LessonBlock({ block, onVocabChanged }) {
  const { blockType, content, vocabulary } = block;

  if (blockType === "text") {
    return (
      <section className="lesson-block lesson-block--text">
        {content?.heading ? <h2>{content.heading}</h2> : null}
        {content?.body ? <p>{renderInlineMarkdown(content.body)}</p> : null}
      </section>
    );
  }

  if (blockType === "example") {
    return (
      <section className="lesson-block lesson-block--example">
        <div className="lesson-example__igbo">{content?.igbo}</div>
        <div className="lesson-example__english">{content?.english}</div>
        {content?.note ? <p className="lesson-example__note">{content.note}</p> : null}
      </section>
    );
  }

  if (blockType === "tip") {
    return (
      <section className="lesson-block lesson-block--tip">
        <div className="lesson-tip__header">
          <Lightbulb size={18} />
          <span>{content?.title || "Tip"}</span>
        </div>
        {content?.body ? <p>{content.body}</p> : null}
      </section>
    );
  }

  if (blockType === "vocabulary_ref" && vocabulary) {
    return (
      <section className="lesson-block lesson-block--vocab">
        <div className="lesson-vocab__word">{vocabulary.word}</div>
        {vocabulary.phonetic ? (
          <div className="lesson-vocab__phonetic">{vocabulary.phonetic}</div>
        ) : null}
        <div className="lesson-vocab__translation">{vocabulary.translation}</div>
        {vocabulary.exampleSentence ? (
          <p className="lesson-vocab__example">{vocabulary.exampleSentence}</p>
        ) : null}
        <SaveWordButton vocabulary={vocabulary} onChanged={onVocabChanged} />
      </section>
    );
  }

  return null;
}

export default function LessonViewer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError("");
    setLocked(false);
    setActionError("");
    try {
      const result = await fetchLesson(lessonId);
      setData(result);
    } catch (err) {
      if (err?.status === 403 || /locked/i.test(err?.message || "")) {
        setLocked(true);
        setError("This lesson is locked. Complete the previous lesson first.");
      } else if (err?.status === 404) {
        setError("Lesson not found.");
      } else {
        setError(err?.message || "Unable to load lesson.");
      }
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const lesson = data?.lesson;
  const isStarted = lesson?.completionStatus === "started";
  const isCompleted = lesson?.completionStatus === "completed";

  async function handleStart() {
    setActionLoading(true);
    setActionError("");
    try {
      await startLesson(lessonId);
      await loadLesson();
    } catch (err) {
      setActionError(err?.message || "Unable to start lesson.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    setActionLoading(true);
    setActionError("");
    try {
      if (!isStarted && !isCompleted) {
        await startLesson(lessonId);
      }
      await completeLesson(lessonId);
      navigate("/learn", { state: { refreshed: true } });
    } catch (err) {
      setActionError(err?.message || "Unable to complete lesson.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="lesson-viewer page-container">
        <div className="lesson-viewer__nav">
          <Link to="/learn" className="lesson-back-link">
            <ArrowLeft size={18} />
            Back to Learn
          </Link>
        </div>

        {loading ? (
          <div className="learn-state learn-state--loading">
            <p>Loading lesson…</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="learn-state learn-state--error">
            {locked ? <Lock size={32} /> : null}
            <h1>{locked ? "Lesson locked" : "Unable to open lesson"}</h1>
            <p>{error}</p>
            <Link to="/learn" className="btn btn-primary">
              Return to Learn
            </Link>
          </div>
        ) : null}

        {!loading && !error && lesson ? (
          <>
            <header className="lesson-viewer__header">
              <span className="lesson-viewer__badge">
                <MessageSquare size={14} />
                Lesson {lesson.orderIndex}
              </span>
              <h1>{lesson.title}</h1>
              {lesson.summary ? <p className="lesson-viewer__summary">{lesson.summary}</p> : null}
              {isCompleted ? (
                <span className="lesson-status-badge lesson-status-badge--done">
                  <Check size={14} />
                  Completed
                </span>
              ) : isStarted ? (
                <span className="lesson-status-badge lesson-status-badge--progress">In progress</span>
              ) : null}
            </header>

            <div className="lesson-viewer__content">
              {(data.blocks || []).map((block) => (
                <LessonBlock
                  key={block.id}
                  block={block}
                  onVocabChanged={({ vocabularyId, saved, userVocabularyId }) => {
                    setData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        blocks: (prev.blocks || []).map((b) => {
                          if (!b.vocabulary || b.vocabulary.id !== vocabularyId) return b;
                          return {
                            ...b,
                            vocabulary: {
                              ...b.vocabulary,
                              saved,
                              userVocabularyId,
                            },
                          };
                        }),
                      };
                    });
                  }}
                />
              ))}
            </div>

            {actionError ? <p className="lesson-viewer__action-error">{actionError}</p> : null}

            <div className="lesson-viewer__actions">
              {!isCompleted && !isStarted ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleStart}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Starting…" : "Start Lesson"}
                </button>
              ) : null}
              {!isCompleted ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleComplete}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving…" : "Complete Lesson"}
                </button>
              ) : (
                <Link to="/learn" className="btn btn-primary">
                  Back to Dashboard
                </Link>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
