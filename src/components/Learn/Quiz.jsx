import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import AppLayout from "../AppLayout";
import { fetchCourses, fetchQuiz, fetchQuizzes, submitQuiz } from "../../services/mockApi";
import "./Practice.css";

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get("quizId");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const coursesRes = await fetchCourses();
      const igbo = (coursesRes.courses || []).find((c) => c.slug === "igbo");
      const res = await fetchQuizzes(igbo?.id);
      setQuizzes(res.quizzes || []);
    } catch (err) {
      setError(err?.message || "Unable to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuiz = useCallback(async (id) => {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    try {
      const data = await fetchQuiz(id);
      setQuizData(data);
    } catch (err) {
      setError(err?.message || "Unable to load quiz.");
      setQuizData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (quizId) loadQuiz(quizId);
    else loadList();
  }, [quizId, loadQuiz, loadList]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quizData) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = (quizData.questions || []).map((q) => ({
        questionId: q.id,
        selectedIndex: answers[q.id] ?? -1,
      }));
      const res = await submitQuiz(quizId, payload);
      setResult(res);
    } catch (err) {
      setError(err?.message || "Unable to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="practice-page page-container">
        <Link to="/learn" className="practice-back">
          <ArrowLeft size={18} />
          Back to Learn
        </Link>

        {!quizId ? (
          <>
            <h1>Quizzes</h1>
            <p className="practice-page__sub">Test what you know with multiple-choice quizzes.</p>
            {loading ? <p>Loading quizzes…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}
            <ul className="practice-list">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    className={`practice-list-item${q.locked ? " is-locked" : ""}`}
                    onClick={() => !q.locked && navigate(`/learn/quizzes?quizId=${q.id}`)}
                  >
                    <div>
                      <h2>{q.title}</h2>
                      <p>
                        {q.questionCount} questions · pass {q.passPct}%
                        {q.bestScore != null ? ` · best ${q.bestScore}%` : ""}
                        {q.credited ? " · credited" : ""}
                        {q.locked ? " · Locked" : ""}
                      </p>
                    </div>
                    {q.locked ? <Lock size={18} /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>{quizData?.quiz?.title || "Quiz"}</h1>
            <p className="practice-page__sub">{quizData?.quiz?.description}</p>
            {loading ? <p>Loading…</p> : null}
            {error ? <p className="learn-state learn-state--error">{error}</p> : null}

            {result ? (
              <div className="quiz-result">
                <h2>
                  Score: {result.attempt.scorePct}% ({result.attempt.correctCount}/
                  {result.attempt.totalCount})
                </h2>
                <p>
                  {result.attempt.passed ? "Passed." : "Not passed yet."}{" "}
                  {result.attempt.credited
                    ? "This attempt counted toward your quiz stats."
                    : result.attempt.alreadyCredited
                      ? "Quiz already credited earlier — practice only."
                      : "Score below pass mark — not credited."}
                </p>
                {(result.results || []).map((r) => (
                  <div key={r.questionId} className="quiz-question">
                    <h2>{r.prompt}</h2>
                    <div className="quiz-options">
                      {r.options.map((o) => (
                        <div
                          key={o.index}
                          className={`quiz-option${
                            o.index === r.correctIndex
                              ? " is-correct"
                              : o.index === r.selectedIndex
                                ? " is-wrong"
                                : ""
                          }`}
                        >
                          {o.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-primary" onClick={() => loadQuiz(quizId)}>
                  Retry quiz
                </button>{" "}
                <Link to="/learn/quizzes" className="btn btn-outline">
                  All quizzes
                </Link>
              </div>
            ) : null}

            {!loading && quizData && !result ? (
              <form onSubmit={handleSubmit}>
                {(quizData.questions || []).map((q, qi) => (
                  <div key={q.id} className="quiz-question">
                    <h2>
                      {qi + 1}. {q.prompt}
                    </h2>
                    <div className="quiz-options">
                      {q.options.map((o) => (
                        <button
                          key={o.index}
                          type="button"
                          className={`quiz-option${answers[q.id] === o.index ? " is-selected" : ""}`}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.index }))}
                        >
                          {o.text}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit quiz"}
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </AppLayout>
  );
}
