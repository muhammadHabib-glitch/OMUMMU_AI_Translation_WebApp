import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "../AppLayout";
import { fetchCourses, fetchExercises, submitExercise } from "../../services/mockApi";
import "./Practice.css";

export default function Exercise() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exercises, setExercises] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const coursesRes = await fetchCourses();
      const igbo = (coursesRes.courses || []).find((c) => c.slug === "igbo");
      if (!igbo?.id) {
        setExercises([]);
        return;
      }
      const res = await fetchExercises({ courseId: igbo.id });
      setExercises(res.exercises || []);
    } catch (err) {
      setError(err?.message || "Unable to load exercises.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(exerciseId) {
    setSubmittingId(exerciseId);
    setError("");
    try {
      const res = await submitExercise(exerciseId, answers[exerciseId] || "");
      setFeedback((prev) => ({
        ...prev,
        [exerciseId]: res.attempt,
      }));
      if (res.attempt.isCorrect) {
        setExercises((prev) =>
          prev.map((e) => (e.id === exerciseId ? { ...e, completed: true } : e))
        );
      }
    } catch (err) {
      setError(err?.message || "Unable to submit answer.");
    } finally {
      setSubmittingId(null);
    }
  }

  const completedCount = exercises.filter((e) => e.completed).length;

  return (
    <AppLayout>
      <div className="practice-page page-container">
        <Link to="/learn" className="practice-back">
          <ArrowLeft size={18} />
          Back to Learn
        </Link>
        <h1>Exercises</h1>
        <p className="practice-page__sub">
          Practice translations from unlocked Igbo lessons. {completedCount}/{exercises.length}{" "}
          completed.
        </p>
        {loading ? <p>Loading exercises…</p> : null}
        {error ? <p className="learn-state learn-state--error">{error}</p> : null}
        {!loading && !exercises.length ? (
          <div className="learn-state learn-state--empty">
            <p>No unlocked exercises yet. Enroll and complete earlier lessons to unlock more.</p>
          </div>
        ) : null}

        {exercises.map((ex) => {
          const fb = feedback[ex.id];
          return (
            <div key={ex.id} className={`exercise-card${ex.completed ? " is-done" : ""}`}>
              <h2>{ex.prompt}</h2>
              <div className="exercise-form">
                <input
                  value={answers[ex.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [ex.id]: e.target.value }))
                  }
                  placeholder="Type your answer"
                  disabled={ex.completed && fb?.isCorrect}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submittingId === ex.id || !String(answers[ex.id] || "").trim()}
                  onClick={() => handleSubmit(ex.id)}
                >
                  {submittingId === ex.id ? "Checking…" : "Check"}
                </button>
              </div>
              {fb ? (
                <p className={`exercise-feedback${fb.isCorrect ? " is-ok" : " is-bad"}`}>
                  {fb.isCorrect
                    ? "Correct — marked complete."
                    : `Not quite. Expected: ${fb.expectedAnswer}`}
                </p>
              ) : ex.completed ? (
                <p className="exercise-feedback is-ok">Already completed.</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
}
