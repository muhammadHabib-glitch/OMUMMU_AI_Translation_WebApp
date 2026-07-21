import React, { useState } from "react";
import "./Community.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Icon from "../assets/Icon.png";
import {  Star } from "iconoir-react"
import { ChartArea, ChartScatter, ThumbsDown, ThumbsUp, TrophyIcon } from "lucide-react";
import { ChatBubble } from "iconoir-react/regular";

const initialPosts = [
  {
    id: 1,
    initials: "AO",
    name: "Amara O.",
    meta: "Igbo · Anambra dialect · 2 hours ago",
    original: '"Thank you for your help"',
    suggestion: "Daalụ maka enyemaka gị",
    likes: 24,
    dislikes: 2,
    comments: 8,
    avatarBg: "#dbe4ff",
  },
  {
    id: 2,
    initials: "KA",
    name: "Kwame A.",
    meta: "Swahili · Kenya · 5 hours ago",
    original: '"Good evening"',
    suggestion: "Habari za jioni",
    likes: 18,
    dislikes: 0,
    comments: 3,
    avatarBg: "#dbe4ff",
  },
  {
    id: 3,
    initials: "FH",
    name: "Fatima H.",
    meta: "Hausa · Nigeria · 8 hours ago",
    original: '"Welcome home"',
    suggestion: "Barka da zuwa gida",
    likes: 31,
    dislikes: 0,
    comments: 12,
    avatarBg: "#e9e9ee",
  },
];

const topContributors = [
  { initials: "JO", name: "John O.", pts: 1240, bg: "#dbe4ff" },
  { initials: "MA", name: "Musa A.", pts: 980, bg: "#d6f0e8" },
  { initials: "EL", name: "Efe L.", pts: 850, bg: "#dbe4ff" },
  { initials: "SM", name: "Sarah M.", pts: 720, bg: "#e9e9ee" },
  { initials: "BT", name: "Bisi T.", pts: 640, bg: "#e9e9ee" },
];

const languagesNeedingHelp = [
  { name: "Igbo", pct: 78 },
  { name: "Yoruba", pct: 65 },
  { name: "Pidgin", pct: 42 },
  { name: "Hausa", pct: 88 },
];

const guidelines = [
  "Be respectful to all contributors.",
  "Cite the specific dialect when suggesting translations.",
  "Vote honestly based on linguistic accuracy.",
];

function PostCard({ post, onLike, onDislike }) {
  return (
    <div className="post-card">
      <div className="post-header">
        <div className="avatar" style={{ background: post.avatarBg }}>
          {post.initials}
        </div>
        <div>
          <div className="post-name">{post.name}</div>
          <div className="post-meta">{post.meta}</div>
        </div>
      </div>

      <div className="translation-box">
        <div className="label">ORIGINAL</div>
        <div className="original-text">{post.original}</div>
        <div className="divider" />
        <div className="label">SUGGESTION</div>
        <div className="suggestion-text">{post.suggestion}</div>
      </div>

      <div className="post-footer">
        <div className="actions">
          <button className="action-btn" onClick={() => onLike(post.id)}>
            <ThumbsUp width={20} height={20} /> {post.likes}
          </button>
          {post.dislikes > 0 && (
            <button className="action-btn" onClick={() => onDislike(post.id)}>
              <ThumbsDown width={20} height={20} /> {post.dislikes}
            </button>
          )}
          <span className="action-btn static"><ChatBubble width={20} height={20} />  {post.comments}</span>
        </div>
        <button className="share-btn" aria-label="share">
          ⤴
        </button>
      </div>
    </div>
  );
}

export default function Community() {
  const [posts, setPosts] = useState(initialPosts);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ language: "", original: "", suggestion: "" });

  const handleLike = (id) =>
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: x.likes + 1 } : x)));

  const handleDislike = (id) =>
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, dislikes: x.dislikes + 1 } : x)));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.original || !form.suggestion) return;
    const newPost = {
      id: Date.now(),
      initials: "YO",
      name: "You",
      meta: `${form.language || "Unknown"} · just now`,
      original: `"${form.original}"`,
      suggestion: form.suggestion,
      likes: 0,
      dislikes: 0,
      comments: 0,
      avatarBg: "#d6f0e8",
    };
    setPosts((p) => [newPost, ...p]);
    setForm({ language: "", original: "", suggestion: "" });
    setShowModal(false);
  };

  return (
    <div>
      <Navbar />

      <div className="community-page">

        <div className="community-header">
          <div>
            <h1>Community</h1>
            <p>Help improve translations for African languages and dialects</p>
          </div>
          <button className="suggest-btn" onClick={() => setShowModal(true)}>
            + Suggest Translation
          </button>
        </div>

        <div className="community-grid">
          <div className="feed-column">
            {posts.map((post) => (
              <PostCard post={post} key={post.id} onLike={handleLike} onDislike={handleDislike} />
            ))}
          </div>

          <div className="sidebar-column">
            <div className="sidebar-card">
              <div className="sidebar-title-row">
                <h3>Top Contributors</h3>
                <TrophyIcon size={27} color="#4FA095" weight="fill" margin-bottom="5%"/>
              </div>
              <ul className="contributor-list">
                {topContributors.map((c, i) => (
                  <li key={c.initials}>
                    <span className="rank">{i + 1}</span>
                    <span className="mini-avatar" style={{ background: c.bg }}>
                      {c.initials}
                    </span>
                    <span className="contributor-name">{c.name}</span>
                    <span className="contributor-pts">{c.pts.toLocaleString()} pts</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lang-list lang-card">
              {languagesNeedingHelp.map((l) => (
                <div className="lang-item" key={l.name}>
                  <div className="lang-row-top">
                    <span>{l.name}</span>
                    <span>{l.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${l.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="guidelines-card">
              <h3>Community Guidelines</h3>
              <ul>
                {guidelines.map((g) => (
                  <li key={g}>
                    <span className="check">✓</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Suggest a Translation</h3>
              <form onSubmit={handleSubmit}>
                <label>
                  Language / Dialect
                  <input
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    placeholder="e.g. Yoruba · Lagos dialect"
                  />
                </label>
                <label>
                  Original text
                  <input
                    value={form.original}
                    onChange={(e) => setForm({ ...form, original: e.target.value })}
                    placeholder="e.g. Good morning"
                    required
                  />
                </label>
                <label>
                  Suggested translation
                  <input
                    value={form.suggestion}
                    onChange={(e) => setForm({ ...form, suggestion: e.target.value })}
                    placeholder="e.g. Ẹ káàárọ̀"
                    required
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}