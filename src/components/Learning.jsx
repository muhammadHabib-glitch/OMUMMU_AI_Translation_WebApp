import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Flame,
  Star,
  Mic,
  Layers,
  ClipboardList,
  MessageCircle,
  Sparkles,
  Zap,
  Lock,
  Check,
  MoreVertical,
  Users,
  ArrowRight,
  BookOpen,
  Award,
} from "lucide-react";
import AppLayout from "./AppLayout";
import {
  enrollLearnCourse,
  explainLanguage,
  fetchContinueLearning,
  fetchCourses,
  fetchDailyChallenge,
  fetchLearnBadges,
  fetchLearnRecommendations,
  fetchLearnStats,
  fetchRecentLessons,
  updateLearnProfile,
  fetchBillingConfig,
  fetchBillingPlans,
} from "../services/mockApi";
import UpgradeModal from "./UpgradeModal";
import { isPremiumUser } from "../utils/entitlements";
import "./Learning.css";

const LANG_CHIPS = [
  { label: "Igbo", available: true },
  { label: "Yoruba", available: false },
  { label: "Swahili", available: false },
  { label: "Hausa", available: false },
];

const COMING_SOON_COURSES = [
  { name: "Yoruba", desc: "Greetings, tones, and cultural etiquette — coming soon." },
  { name: "Swahili", desc: "East African phrases and conversation basics — coming soon." },
  { name: "Hausa", desc: "Northern Nigerian language fundamentals — coming soon." },
];

const PRACTICE_TOOLS = [
  { id: "flashcards", label: "Flashcards", desc: "Drill key vocabulary", icon: Layers, to: "/learn/flashcards" },
  { id: "quizzes", label: "Quizzes", desc: "Test what you know", icon: ClipboardList, to: "/learn/quizzes" },
  { id: "exercises", label: "Exercises", desc: "Practice translations", icon: BookOpen, to: "/learn/exercises" },
  { id: "conversation", label: "Conversation", desc: "Practice real dialogue", icon: MessageCircle, to: "/learn/conversation" },
  { id: "speaking", label: "Speaking", desc: "Pronunciation with AI feedback", icon: Mic, to: "/learn/speaking" },
];

function formatXp(value) {
  return Number(value || 0).toLocaleString();
}

export default function Learning() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState("Igbo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [continueData, setContinueData] = useState(null);
  const [recentLessons, setRecentLessons] = useState([]);
  const [badgesData, setBadgesData] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [enrollingId, setEnrollingId] = useState(null);
  const [practiceNotice, setPracticeNotice] = useState("");
  const [explainTopic, setExplainTopic] = useState("How do I greet elders politely?");
  const [explainResult, setExplainResult] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingPlans, setBillingPlans] = useState([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);

  const isIgboActive = activeLang === "Igbo";
  const igboCourse = useMemo(
    () => courses.find((c) => c.languageCode === "ig" || c.slug === "igbo") || courses[0] || null,
    [courses]
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, coursesRes, continueRes, badgesRes, challengeRes, recsRes] =
        await Promise.all([
          fetchLearnStats(),
          fetchCourses(),
          fetchContinueLearning(),
          fetchLearnBadges(),
          fetchDailyChallenge(),
          fetchLearnRecommendations(),
        ]);
      setStats(statsRes.stats || null);
      setCourses(coursesRes.courses || []);
      setContinueData(continueRes.continue ?? null);
      setBadgesData(badgesRes || null);
      setDailyChallenge(challengeRes.dailyChallenge ?? null);
      setRecommendations(recsRes.recommendations || []);

      const courseList = coursesRes.courses || [];
      const igbo =
        courseList.find((c) => c.languageCode === "ig" || c.slug === "igbo") || courseList[0];
      if (igbo?.id) {
        const recentRes = await fetchRecentLessons(igbo.id);
        setRecentLessons(recentRes.lessons || []);
      } else {
        setRecentLessons([]);
      }

      if (statsRes.stats?.activeLanguage) {
        setActiveLang(statsRes.stats.activeLanguage);
      }
    } catch (err) {
      setError(err?.message || "Unable to load learning dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, location.key, location.state?.refreshed]);

  useEffect(() => {
    Promise.all([fetchBillingConfig(), fetchBillingPlans()])
      .then(([config, plansData]) => {
        setCheckoutAvailable(Boolean(config.checkoutAvailable));
        setBillingPlans(plansData.plans || []);
      })
      .catch(() => setCheckoutAvailable(false));
  }, []);

  async function handleLangChange(lang, available) {
    setActiveLang(lang);
    setPracticeNotice("");
    if (available && lang === "Igbo") {
      try {
        const res = await updateLearnProfile(lang);
        setStats(res.stats || stats);
      } catch {
        /* profile update is best-effort */
      }
    }
  }

  async function handleEnroll(courseId) {
    setEnrollingId(courseId);
    setError("");
    try {
      await enrollLearnCourse(courseId);
      await loadDashboard();
    } catch (err) {
      setError(err?.message || "Unable to enroll in course.");
    } finally {
      setEnrollingId(null);
    }
  }

  function handlePracticeClick(tool) {
    if (tool.to) {
      navigate(tool.to);
      return;
    }
    setPracticeNotice(`${tool.label} — coming soon.`);
  }

  async function handleExplain(e) {
    e.preventDefault();
    setExplainError("");
    setExplainLoading(true);
    try {
      const data = await explainLanguage(explainTopic, activeLang);
      setExplainResult(data.text || "");
    } catch (err) {
      setExplainError(err?.message || "Unable to get explanation.");
    } finally {
      setExplainLoading(false);
    }
  }

  function openLesson(lessonId, status) {
    if (status === "locked") return;
    navigate(`/learn/lesson/${lessonId}`);
  }

  const continueCourse = continueData?.course;
  const continueLesson = continueData?.lesson;
  const hasEnrollment = Boolean(igboCourse?.enrolled);
  const continueProgress = continueCourse?.progressPct ?? igboCourse?.progressPct ?? 0;

  const comingSoonCourseCards = COMING_SOON_COURSES.filter(
    (item) => !courses.some((c) => c.name?.toLowerCase() === item.name.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="learning-page page-container">
        <header className="learning-header">
          <div>
            <h1>Learn</h1>
            <p>Master African languages with AI-powered lessons</p>
          </div>
          <div className="learning-stats">
            <span className="stat-pill">
              <span className="stat-pill__dot" />
              {loading ? "…" : stats?.activeLanguage || activeLang}
            </span>
            <span className="stat-pill">
              <Flame size={16} className="stat-pill__icon accent" />
              {loading ? "…" : `${stats?.streak ?? 0} Day${stats?.streak === 1 ? "" : "s"} streak`}
            </span>
            <span className="stat-pill">
              <Star size={16} className="stat-pill__icon gold" />
              {loading ? "…" : `${formatXp(stats?.xp)} XP`}
            </span>
          </div>
        </header>

        <div className="lang-chips" role="tablist" aria-label="Learning language">
          {LANG_CHIPS.map(({ label, available }) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={activeLang === label}
              className={`lang-chip${activeLang === label ? " is-active" : ""}${!available ? " is-unavailable" : ""}`}
              onClick={() => handleLangChange(label, available)}
            >
              {label}
              {!available ? <span className="lang-chip__soon">Soon</span> : null}
            </button>
          ))}
        </div>

        {error ? (
          <div className="learn-state learn-state--error learn-state--inline">
            <p>{error}</p>
            <button type="button" className="btn btn-outline" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        ) : null}

        {!isIgboActive ? (
          <div className="learn-coming-soon-panel">
            <Lock size={28} />
            <h2>{activeLang} — Coming soon</h2>
            <p>
              Course content for {activeLang} is not available yet. Switch to Igbo to start learning
              with live lessons, progress tracking, and AI explanations.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => handleLangChange("Igbo", true)}>
              Switch to Igbo
            </button>
          </div>
        ) : null}

        <div className={`learning-layout${!isIgboActive ? " learning-layout--dimmed" : ""}`}>
          <div className="learning-main">
            <section className="continue-card">
              <div className="continue-card__content">
                {loading ? (
                  <div className="learn-state learn-state--loading">
                    <p>Loading your progress…</p>
                  </div>
                ) : !hasEnrollment ? (
                  <>
                    <span className="in-progress-badge">GET STARTED</span>
                    <h2>{igboCourse?.name || "Igbo"}</h2>
                    <p className="continue-card__desc">
                      {igboCourse?.description ||
                        "Begin with greetings, numbers, and respectful introductions."}
                    </p>
                    <div className="continue-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!igboCourse || enrollingId === igboCourse?.id}
                        onClick={() => igboCourse && handleEnroll(igboCourse.id)}
                      >
                        {enrollingId === igboCourse?.id ? "Enrolling…" : "Start Learning"}
                      </button>
                    </div>
                  </>
                ) : continueLesson ? (
                  <>
                    <span className="in-progress-badge">IN PROGRESS</span>
                    <h2>{continueLesson.title}</h2>
                    <p className="continue-card__desc">{continueCourse?.name}</p>
                    <div className="progress-meta">
                      <span>Course Progress</span>
                      <span>{continueProgress}%</span>
                    </div>
                    <div className="progress-track" aria-hidden="true">
                      <div className="progress-fill" style={{ width: `${continueProgress}%` }} />
                    </div>
                    <div className="continue-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => openLesson(continueLesson.id, "available")}
                      >
                        Continue Lesson
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate("/learn/flashcards")}
                      >
                        Review Flashcards
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="in-progress-badge">COMPLETED</span>
                    <h2>All lessons complete</h2>
                    <p className="continue-card__desc">
                      You have finished every published lesson in {continueCourse?.name || "this course"}.
                    </p>
                    <div className="progress-meta">
                      <span>Course Progress</span>
                      <span>{continueProgress}%</span>
                    </div>
                    <div className="progress-track" aria-hidden="true">
                      <div className="progress-fill" style={{ width: `${continueProgress}%` }} />
                    </div>
                  </>
                )}
              </div>
              <div className="continue-card__art" aria-hidden="true">
                <div className="bubble-ring" />
                <span className="speech-bubble speech-bubble--one">Ndewo</span>
                <span className="speech-bubble speech-bubble--two">Kedu</span>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <h2>Practice Tools</h2>
              </div>
              {practiceNotice ? <p className="learn-notice">{practiceNotice}</p> : null}
              <div className="practice-grid">
                {PRACTICE_TOOLS.map((tool) => {
                  const { id, label, desc, icon: Icon, to } = tool;
                  return (
                  <button
                    type="button"
                    key={id}
                    className={`practice-card${!to ? " practice-card--soon" : ""}`}
                    onClick={() => handlePracticeClick(tool)}
                  >
                    <span className="practice-card__icon">
                      <Icon size={22} />
                    </span>
                    <span className="practice-card__label">{label}</span>
                    <span className="practice-card__desc">{desc}</span>
                    {!to ? <span className="practice-card__soon">Coming soon</span> : null}
                  </button>
                  );
                })}
              </div>
            </section>

            <section className="speaking-card">
              <div className="speaking-card__text">
                <span className="speaking-card__tag">
                  <Sparkles size={14} />
                  AI POWERED
                </span>
                <h2>AI Speaking Practice</h2>
                <p>
                  Listen to Igbo phrases, speak into your microphone, and get real AI pronunciation
                  feedback. Earn XP when you pass.
                </p>
              </div>
              <Link to="/learn/speaking" className="btn btn-accent speaking-cta">
                <Mic size={18} />
                Start speaking
              </Link>
            </section>

            <section className="explain-card">
              <div className="section-heading">
                <h2>AI Language Explanations</h2>
              </div>
              <p className="explain-card__sub">
                Ask Omummu to explain phrases, tones, or culture tips for{" "}
                <strong>{activeLang}</strong>.
              </p>
              <form className="explain-form" onSubmit={handleExplain}>
                <input
                  className="explain-input"
                  value={explainTopic}
                  onChange={(e) => setExplainTopic(e.target.value)}
                  placeholder="e.g. How do I say good morning?"
                />
                <button type="submit" className="btn btn-primary" disabled={explainLoading}>
                  {explainLoading ? "Explaining…" : "Explain"}
                </button>
              </form>
              {explainError ? <p className="explain-error">{explainError}</p> : null}
              {explainResult ? (
                <div className="explain-result">
                  {explainResult.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="progress-stats">
              <h2 className="sr-only">Your Progress</h2>
              <div className="progress-stat">
                <span className="progress-stat__value">{loading ? "…" : stats?.lessons ?? 0}</span>
                <span className="progress-stat__label">LESSONS</span>
              </div>
              <Link to="/learn/vocabulary" className="progress-stat progress-stat--link">
                <span className="progress-stat__value">{loading ? "…" : stats?.words ?? 0}</span>
                <span className="progress-stat__label">WORDS</span>
              </Link>
              <div className="progress-stat">
                <span className="progress-stat__value">{loading ? "…" : stats?.quizzes ?? 0}</span>
                <span className="progress-stat__label">QUIZZES</span>
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <h2>Your Courses</h2>
              </div>
              <div className="courses-grid" id="courses">
                {loading ? (
                  <div className="learn-state learn-state--loading">
                    <p>Loading courses…</p>
                  </div>
                ) : (
                  <>
                    {courses.map((course) => (
                      <article
                        key={course.id}
                        className={`course-card${course.enrolled ? " is-active" : ""}`}
                      >
                        <div className="course-card__top">
                          <span className="course-card__icon">
                            <BookOpen size={20} />
                          </span>
                          <span className="course-card__lessons">
                            {course.publishedLessonCount} Lessons
                          </span>
                        </div>
                        <h3>{course.name}</h3>
                        <p>{course.description}</p>
                        {!course.enrolled ? (
                          <button
                            type="button"
                            className="course-start"
                            disabled={enrollingId === course.id}
                            onClick={() => handleEnroll(course.id)}
                          >
                            {enrollingId === course.id ? "Enrolling…" : "Start course"}{" "}
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <>
                            <div className="progress-track progress-track--sm" aria-hidden="true">
                              <div
                                className="progress-fill"
                                style={{ width: `${course.progressPct || 0}%` }}
                              />
                            </div>
                            <span className="course-progress-label">
                              {course.progressPct || 0}% Completed
                            </span>
                          </>
                        )}
                      </article>
                    ))}
                    {comingSoonCourseCards.map((course) => (
                      <article key={course.name} className="course-card is-locked">
                        <span className="course-tag">Coming soon</span>
                        <div className="course-card__top">
                          <span className="course-card__icon">
                            <Lock size={20} />
                          </span>
                        </div>
                        <h3>{course.name}</h3>
                        <p>{course.desc}</p>
                        <button type="button" className="course-start" disabled>
                          Coming soon <Lock size={14} />
                        </button>
                      </article>
                    ))}
                  </>
                )}
              </div>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <h2>Recent Lessons</h2>
                <Link to="/learn/vocabulary" className="view-all">
                  Dictionary
                </Link>
              </div>
              {loading ? (
                <div className="learn-state learn-state--loading">
                  <p>Loading lessons…</p>
                </div>
              ) : !hasEnrollment ? (
                <div className="learn-state learn-state--empty">
                  <p>Enroll in Igbo to see your lesson list and progress.</p>
                </div>
              ) : recentLessons.length === 0 ? (
                <div className="learn-state learn-state--empty">
                  <p>No lessons available yet.</p>
                </div>
              ) : (
                <div className="recent-lessons">
                  {recentLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`recent-lesson${lesson.status === "locked" ? " is-locked" : " is-clickable"}`}
                      onClick={() => openLesson(lesson.id, lesson.status)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openLesson(lesson.id, lesson.status);
                      }}
                      role={lesson.status !== "locked" ? "button" : undefined}
                      tabIndex={lesson.status !== "locked" ? 0 : undefined}
                    >
                      <span className={`recent-lesson__status status-${lesson.status}`}>
                        {lesson.status === "mastered" && <Check size={16} />}
                        {lesson.status === "progress" && <span className="partial-ring" />}
                        {(lesson.status === "locked" || lesson.status === "available") &&
                          (lesson.status === "locked" ? (
                            <Lock size={14} />
                          ) : (
                            <BookOpen size={14} />
                          ))}
                      </span>
                      <div className="recent-lesson__text">
                        <div className="recent-lesson__title">{lesson.title}</div>
                        <div className="recent-lesson__meta">{lesson.meta}</div>
                        {lesson.status === "progress" && lesson.progress != null && (
                          <div className="progress-track progress-track--sm" aria-hidden="true">
                            <div className="progress-fill" style={{ width: `${lesson.progress}%` }} />
                          </div>
                        )}
                      </div>
                      {lesson.status !== "locked" ? (
                        <button
                          type="button"
                          className="recent-lesson__menu"
                          aria-label="Open lesson"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLesson(lesson.id, lesson.status);
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="community-banner">
              <div className="community-banner__icon">
                <Users size={22} />
              </div>
              <div>
                <h3>Community contributions</h3>
                <p>Help improve translations and earn XP with native speakers.</p>
              </div>
              <Link to="/community" className="btn btn-outline community-banner__cta">
                Contribute
              </Link>
            </section>
          </div>

          <aside className="learning-sidebar">
            <div className="sidebar-card challenge-card">
              <div className="challenge-card__label">
                <Zap size={16} />
                DAILY CHALLENGE
              </div>
              {loading ? (
                <p className="sidebar-soon-text">Loading…</p>
              ) : dailyChallenge?.challenge ? (
                <>
                  <h3>{dailyChallenge.challenge.title}</h3>
                  <p className="sidebar-soon-text">{dailyChallenge.challenge.description}</p>
                  <div className="progress-meta">
                    <span>Progress</span>
                    <span>
                      {Math.min(dailyChallenge.progress, dailyChallenge.challenge.targetCount)}/
                      {dailyChallenge.challenge.targetCount}
                    </span>
                  </div>
                  <div className="progress-track" aria-hidden="true">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (dailyChallenge.progress / Math.max(1, dailyChallenge.challenge.targetCount)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  {dailyChallenge.completed ? (
                    <p className="sidebar-soon-text" style={{ marginTop: 10 }}>
                      Completed today{dailyChallenge.credited ? " · credited" : ""}.
                    </p>
                  ) : (
                    <p className="sidebar-soon-text" style={{ marginTop: 10 }}>
                      Complete this activity in Learn to finish today’s challenge.
                    </p>
                  )}
                </>
              ) : (
                <p className="sidebar-soon-text">No daily challenge configured.</p>
              )}
            </div>

            <div className="sidebar-card badges-card">
              <div className="badges-card__header">
                <h3>
                  <Award size={18} />
                  Badges
                </h3>
                <span>
                  {badgesData?.earnedCount ?? 0} / {badgesData?.totalCount ?? 0}
                </span>
              </div>
              {loading ? (
                <p className="sidebar-soon-text">Loading…</p>
              ) : badgesData?.badges?.length ? (
                <div className="badges-grid">
                  {badgesData.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`badge-item${badge.earned ? " is-earned" : ""}`}
                      title={badge.description}
                    >
                      <div className="badge-circle">
                        {badge.earned ? <Star size={18} /> : <Lock size={14} />}
                        {badge.earned ? (
                          <span className="badge-check">
                            <Check size={10} />
                          </span>
                        ) : null}
                      </div>
                      <span className="badge-label">{badge.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sidebar-soon-text">No badges available yet.</p>
              )}
            </div>

            <div className="sidebar-card recommended-card">
              <h3>Recommended</h3>
              {loading ? (
                <p className="sidebar-soon-text">Loading…</p>
              ) : recommendations.length ? (
                <ul className="recommended-list">
                  {recommendations.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.href || "/learn"}
                        className="recommended-row"
                        style={{ textDecoration: "none", color: "inherit", display: "flex", gap: 12 }}
                      >
                        <span className={`recommended-thumb tone-${item.tone || "navy"}`} />
                        <span>
                          <span className="recommended-title">{item.title}</span>
                          <span className="recommended-meta">{item.meta}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sidebar-soon-text">No recommendations yet — start a course to begin.</p>
              )}
            </div>

            <div className="premium-card">
              <h3>Go Omummu Premium</h3>
              <p>Unlock offline learning and 24/7 AI tutoring.</p>
              <button
                type="button"
                className="btn btn-accent btn-block"
                onClick={() => setUpgradeOpen(true)}
              >
                Upgrade to Premium
              </button>
            </div>
          </aside>
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        plans={billingPlans}
        checkoutAvailable={checkoutAvailable}
      />
    </AppLayout>
  );
}
