import React, { useState } from "react";
import "./Learning.css";
import Footer from "./Footer";
import Navbar from "./Navbar";

const badgesList = [
  { id: "first", label: "First Lesson", icon: "🏅", earned: true, tone: "gold" },
  { id: "streak", label: "7 Day Streak", icon: "📅", earned: true, tone: "blue" },
  { id: "top", label: "Top Learner", icon: "👤", earned: false },
  { id: "helper", label: "Helper", icon: "💬", earned: false },
  { id: "polyglot", label: "Polyglot", icon: "🌐", earned: false },
  { id: "aimaster", label: "AI Master", icon: "✨", earned: false },
];

const initialCourses = [
  {
    id: "igbo",
    icon: "🈴",
    lessons: 12,
    name: "Igbo",
    desc: "Southeast Nigeria dialect & culture",
    progress: 45,
    active: true,
  },
  {
    id: "yoruba",
    icon: "📖",
    lessons: 10,
    name: "Yoruba",
    desc: "Western Nigeria tonal language",
    progress: 20,
  },
  {
    id: "swahili",
    icon: "🌍",
    lessons: 8,
    name: "Swahili",
    desc: "East African Lingua Franca",
    progress: 65,
    tag: "Daily Challenge",
  },
  {
    id: "hausa",
    icon: "🔒",
    lessons: 6,
    name: "Hausa",
    desc: "Northern Nigeria & Sahel regions",
    locked: true,
  },
];

const recentLessons = [
  { id: 1, title: "Basic Greetings", meta: "Mastered 2 days ago", status: "done" },
  { id: 2, title: "Numbers & Counting", meta: "60% in progress", status: "progress" },
  { id: 3, title: "Family & Relationships", meta: "Locked until Level 3", status: "locked" },
  { id: 4, title: "Common Phrases", meta: "Mastered 1 week ago", status: "done" },
];

const recommended = [
  { id: 1, title: "Igbo Tones & Pronunciation", meta: "15 min read · AI Guided", swatch: "#1a1a2e" },
  { id: 2, title: "Yoruba Basics: Greeting Elders", meta: "Short Video · Culture Tip", swatch: "#7a3b1f" },
  { id: 3, title: "AI Conversation Practice", meta: "Interactive · Real-time Feedback", swatch: "#1a1a2e" },
];

export default function Learning() {
  const [courses] = useState(initialCourses);

  return (
    <div>
<Navbar/>

    <div className="learning-page">
      <div className="learning-header">
        <div>
          <h1>Learn</h1>
          <p>Master African languages with AI-powered lessons</p>
        </div>
        <div className="header-badges">
          <span className="pill pill-lang">
            <span className="pill-dot" /> Igbo
          </span>
          <span className="pill pill-streak">🔥 5 Days</span>
          <span className="pill pill-xp">⭐ 1,240 XP</span>
        </div>
      </div>

      <div className="learning-grid">
        {/* LEFT COLUMN */}
        <div className="left-column">
          <div className="current-lesson-card">
            <div className="current-lesson-text">
              <span className="badge-in-progress">IN PROGRESS</span>
              <h2>Igbo Greetings &amp; Introductions</h2>
              <div className="progress-row">
                <span>Course Progress</span>
                <span>45%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "45%" }} />
              </div>
              <div className="lesson-actions">
                <button className="btn-primary">Continue Lesson</button>
                <button className="btn-outline">Review Flashcards</button>
              </div>
            </div>
            <div className="lesson-illustration">
              <div className="bubble-circle" />
              <div className="bubble word-1">Ndewo</div>
              <div className="bubble word-2">Kedu</div>
            </div>
          </div>

          <div className="section-header">
            <h2>Your Courses</h2>
            <a href="#" className="view-all">
              View All
            </a>
          </div>

          <div className="courses-grid">
            {courses.map((c) => (
              <div className={`course-card ${c.active ? "is-active" : ""}`} key={c.id}>
                {c.tag && <span className="course-tag">{c.tag}</span>}
                <div className="course-top">
                  <div className="course-icon">{c.icon}</div>
                  <span className="course-lessons">{c.lessons} Lessons</span>
                </div>
                <h3>{c.name}</h3>
                <p className="course-desc">{c.desc}</p>

                {c.locked ? (
                  <a href="#" className="start-course-link">
                    Start course →
                  </a>
                ) : (
                  <>
                    <div className="progress-track small">
                      <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="course-progress-text">{c.progress}% Completed</span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>Recent Lessons</h2>
          </div>

          <div className="recent-list-card">
            {recentLessons.map((l) => (
              <div className={`recent-row ${l.status === "locked" ? "is-locked" : ""}`} key={l.id}>
                <span className={`recent-status status-${l.status}`}>
                  {l.status === "done" && "✓"}
                  {l.status === "progress" && "◐"}
                  {l.status === "locked" && "🔒"}
                </span>
                <div className="recent-text">
                  <div className="recent-title">{l.title}</div>
                  <div className="recent-meta">{l.meta}</div>
                </div>
                {l.status !== "locked" && <button className="recent-menu">⋮</button>}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          <div className="challenge-card">
            <div className="challenge-title">
              <span>⚡</span> DAILY CHALLENGE
            </div>
            <div className="challenge-inner">
              <h3>Common Phrases in Swahili</h3>
              <div className="progress-row">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: "65%" }} />
              </div>
            </div>
            <button className="btn-primary full-width">Start Challenge</button>
          </div>

          <div className="badges-card">
            <div className="badges-header">
              <h3>Badges</h3>
              <span className="badges-count">2 / 12</span>
            </div>
            <div className="badges-grid">
              {badgesList.map((b) => (
                <div className="badge-item" key={b.id}>
                  <div className={`badge-circle ${b.earned ? `earned ${b.tone}` : "locked"}`}>
                    {b.icon}
                    {b.earned && <span className="badge-check">✓</span>}
                  </div>
                  <span className={`badge-label ${b.earned ? "earned" : ""}`}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recommended-card">
            <h3>Recommended</h3>
            <div className="recommended-list">
              {recommended.map((r) => (
                <div className="recommended-row" key={r.id}>
                  <div className="recommended-thumb" style={{ background: r.swatch }} />
                  <div>
                    <div className="recommended-title">{r.title}</div>
                    <div className="recommended-meta">{r.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card">
            <h3>Go Omummu Premium</h3>
            <p>Unlock offline learning and 24/7 AI tutoring.</p>
            <button className="btn-upgrade">Upgrade Now</button>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    <div/>
    </div>
  );
}