import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ThumbsUp,
  MessageSquare,
  Plus,
  MessageCircle,
  X,
  Flag,
  Loader2,
} from "lucide-react";
import AppLayout from "./AppLayout";
import {
  fetchCommunityPosts,
  createCommunityPost,
  voteCommunityPost,
  fetchCommunityComments,
  createCommunityComment,
  reportCommunityContent,
} from "../services/mockApi";
import { getToken } from "../services/apiClient";
import { timeAgo } from "./admin/analyticsUtils";
import "./Community.css";

function getInitials(name) {
  return String(name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const EMPTY_CORRECTION = {
  original: "",
  suggestion: "",
  lang: "Igbo",
  dialect: "",
};

const EMPTY_THREAD = {
  title: "",
  body: "",
  tag: "Discussion",
  lang: "Igbo",
};

function CommentsPanel({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityComments(postId);
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!getToken()) return;
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createCommunityComment(postId, body.trim());
      setBody("");
      await load();
    } catch (err) {
      setError(err?.message || "Could not post comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="community-comments">
      <div className="community-comments__header">
        <strong>Discussion</strong>
        <button type="button" className="community-comments__close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      {loading ? (
        <p className="community-comments__hint">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="community-comments__hint">No comments yet. Start the discussion.</p>
      ) : (
        <ul className="community-comments__list">
          {comments.map((c) => (
            <li key={c.id}>
              <span className="community-comments__author">{c.userName}</span>
              <span className="community-comments__time">{timeAgo(c.createdAt)}</span>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {getToken() ? (
        <form className="community-comments__form" onSubmit={handleSubmit}>
          {error && <p className="community-comments__error">{error}</p>}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            required
          />
          <button type="submit" className="btn btn-accent btn-sm" disabled={busy}>
            {busy ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="community-comments__hint">
          <Link to="/login">Sign in</Link> to join the discussion.
        </p>
      )}
    </div>
  );
}

function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState("incorrect");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await reportCommunityContent({ targetType, targetId, reason, details });
      setDone(true);
    } catch (err) {
      setError(err?.message || "Could not submit report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="suggest-modal-backdrop"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="suggest-modal" role="dialog" aria-modal="true">
        <div className="suggest-modal__header">
          <h2>Report content</h2>
          <button type="button" className="suggest-modal__close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {done ? (
          <div className="suggest-modal__success">Thanks. Our moderators will review this report.</div>
        ) : (
          <form className="suggest-form" onSubmit={handleSubmit}>
            {error && <p className="community-comments__error">{error}</p>}
            <label className="suggest-field">
              <span>Reason</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="incorrect">Incorrect translation</option>
                <option value="abusive">Abusive or harmful</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="suggest-field">
              <span>Details (optional)</span>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
            </label>
            <div className="suggest-form__actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-accent" disabled={busy}>
                {busy ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("corrections");
  const [posts, setPosts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [threadModalOpen, setThreadModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CORRECTION);
  const [threadForm, setThreadForm] = useState(EMPTY_THREAD);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openDiscussId, setOpenDiscussId] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(searchParams.get("post") || null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCommunityPosts();
      setPosts(data.posts || []);
      setThreads(data.threads || data.forum || []);
    } catch (err) {
      setError(err?.message || "Unable to load community feed.");
      setPosts([]);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId) {
      setActiveThreadId(postId);
      setTab("forums");
    }
  }, [searchParams]);

  function requireAuth() {
    if (!getToken()) {
      navigate("/login");
      return false;
    }
    return true;
  }

  async function handleUpvote(id) {
    if (!requireAuth()) return;
    try {
      const result = await voteCommunityPost(id);
      const updated = result.post;
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votes: updated.votes, votedByMe: true } : p))
      );
      setThreads((prev) =>
        prev.map((p) => (p.id === id ? { ...p, votes: updated.votes, votedByMe: true } : p))
      );
    } catch (err) {
      setError(err?.message || "Could not vote.");
    }
  }

  async function handleSubmitCorrection(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!form.original.trim() || !form.suggestion.trim()) return;
    setBusy(true);
    try {
      await createCommunityPost({
        postType: "correction",
        original: form.original.trim(),
        suggestion: form.suggestion.trim(),
        lang: form.lang,
        dialect: form.dialect.trim() || undefined,
      });
      setSubmitted(true);
      setForm(EMPTY_CORRECTION);
      await loadFeed();
      setTab("corrections");
      setTimeout(() => {
        setSubmitted(false);
        setModalOpen(false);
      }, 900);
    } catch (err) {
      setError(err?.message || "Could not submit suggestion.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitThread(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!threadForm.title.trim()) return;
    setBusy(true);
    try {
      await createCommunityPost({
        postType: "thread",
        title: threadForm.title.trim(),
        body: threadForm.body.trim() || undefined,
        tag: threadForm.tag,
        lang: threadForm.lang,
      });
      setThreadForm(EMPTY_THREAD);
      setThreadModalOpen(false);
      await loadFeed();
      setTab("forums");
    } catch (err) {
      setError(err?.message || "Could not create thread.");
    } finally {
      setBusy(false);
    }
  }

  function openThread(thread) {
    setActiveThreadId(thread.id);
    setSearchParams({ post: thread.id });
  }

  return (
    <AppLayout>
      <div className="community-page page-container">
        <header className="community-header">
          <div>
            <h1>Community</h1>
            <p>Contribute dialect expertise and help improve translations for African languages</p>
          </div>
          <button
            type="button"
            className="community-cta"
            onClick={() => {
              if (!requireAuth()) return;
              setSubmitted(false);
              setModalOpen(true);
            }}
          >
            <Plus size={18} strokeWidth={2.25} />
            Suggest a correction
          </button>
        </header>

        {error && <p className="community-comments__error community-page__error">{error}</p>}

        <div className="community-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "corrections"}
            className={`community-tab${tab === "corrections" ? " is-active" : ""}`}
            onClick={() => setTab("corrections")}
          >
            Suggest Corrections
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "forums"}
            className={`community-tab${tab === "forums" ? " is-active" : ""}`}
            onClick={() => setTab("forums")}
          >
            Forum threads
          </button>
        </div>

        <div className="community-layout">
          <div className="community-main">
            {loading && (
              <p className="community-comments__hint">
                <Loader2 size={16} className="spin-inline" /> Loading…
              </p>
            )}

            {tab === "corrections" && !loading && (
              <div className="community-feed">
                {posts.length === 0 ? (
                  <p className="community-comments__hint">No corrections yet. Be the first to contribute.</p>
                ) : (
                  posts.map((post) => (
                    <article key={post.id} className="correction-card">
                      <div className="correction-card__header">
                        <div className="correction-avatar">{getInitials(post.userName)}</div>
                        <div>
                          <div className="correction-name">{post.userName}</div>
                          <div className="correction-meta">
                            {post.lang}
                            {post.dialect ? ` · ${post.dialect}` : ""} · {timeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="correction-body">
                        <div className="correction-label">Original</div>
                        <p className="correction-original">&ldquo;{post.original}&rdquo;</p>
                        <div className="correction-rule" />
                        <div className="correction-label">Suggestion</div>
                        <p className="correction-suggestion">{post.suggestion}</p>
                      </div>

                      <div className="correction-actions">
                        <button
                          type="button"
                          className={`vote-btn${post.votedByMe ? " is-voted" : ""}`}
                          onClick={() => handleUpvote(post.id)}
                          disabled={post.votedByMe}
                          aria-label={`Upvote (${post.votes})`}
                        >
                          <ThumbsUp size={16} />
                          {post.votes}
                        </button>
                        <button
                          type="button"
                          className="vote-btn"
                          onClick={() => setOpenDiscussId(openDiscussId === post.id ? null : post.id)}
                        >
                          <MessageSquare size={16} />
                          Discuss{post.commentCount ? ` (${post.commentCount})` : ""}
                        </button>
                        <button
                          type="button"
                          className="vote-btn"
                          onClick={() => {
                            if (!requireAuth()) return;
                            setReportTarget({ targetType: "post", targetId: post.id });
                          }}
                          aria-label="Report"
                        >
                          <Flag size={16} />
                        </button>
                      </div>

                      {openDiscussId === post.id && (
                        <CommentsPanel postId={post.id} onClose={() => setOpenDiscussId(null)} />
                      )}
                    </article>
                  ))
                )}
              </div>
            )}

            {tab === "forums" && !loading && (
              <div className="forum-list">
                <div className="forum-list__toolbar">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      if (!requireAuth()) return;
                      setThreadModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> New thread
                  </button>
                </div>
                {threads.length === 0 ? (
                  <p className="community-comments__hint">No forum threads yet.</p>
                ) : (
                  threads.map((thread) => (
                    <article
                      key={thread.id}
                      className={`forum-card${activeThreadId === thread.id ? " is-active" : ""}`}
                    >
                      <button type="button" className="forum-card__open" onClick={() => openThread(thread)}>
                        <div className="forum-card__body">
                          <span className="forum-tag">{thread.tag || "Discussion"}</span>
                          <h3>{thread.title}</h3>
                          {thread.body && <p className="forum-card__preview">{thread.body}</p>}
                        </div>
                        <div className="forum-card__meta">
                          <MessageCircle size={16} />
                          {thread.commentCount ?? 0} replies
                        </div>
                      </button>
                      {activeThreadId === thread.id && (
                        <CommentsPanel
                          postId={thread.id}
                          onClose={() => {
                            setActiveThreadId(null);
                            setSearchParams({});
                          }}
                        />
                      )}
                    </article>
                  ))
                )}
              </div>
            )}
          </div>

          <aside className="community-aside">
            <div className="suggest-cta">
              <div className="suggest-cta__icon">
                <Plus size={22} strokeWidth={2.5} />
              </div>
              <h3>Suggest a correction</h3>
              <p>Share dialect expertise and help make Omummu more accurate for everyone.</p>
              <button
                type="button"
                className="suggest-cta__btn"
                onClick={() => {
                  if (!requireAuth()) return;
                  setSubmitted(false);
                  setModalOpen(true);
                }}
              >
                Suggest a correction
              </button>
            </div>
          </aside>
        </div>
      </div>

      {modalOpen && (
        <div
          className="suggest-modal-backdrop"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="suggest-modal" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
            <div className="suggest-modal__header">
              <h2 id="suggest-modal-title">Suggest a correction</h2>
              <button type="button" className="suggest-modal__close" aria-label="Close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {submitted ? (
              <div className="suggest-modal__success">Thanks! Your suggestion was added to the feed.</div>
            ) : (
              <form className="suggest-form" onSubmit={handleSubmitCorrection}>
                <label className="suggest-field">
                  <span>Language / dialect</span>
                  <select value={form.lang} onChange={(e) => setForm((f) => ({ ...f, lang: e.target.value }))}>
                    <option>Igbo</option>
                    <option>Yoruba</option>
                    <option>Hausa</option>
                    <option>Swahili</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="suggest-field">
                  <span>Specific dialect (optional)</span>
                  <input
                    type="text"
                    value={form.dialect}
                    onChange={(e) => setForm((f) => ({ ...f, dialect: e.target.value }))}
                    placeholder="e.g. Owerri Igbo"
                  />
                </label>
                <label className="suggest-field">
                  <span>Original text</span>
                  <input
                    type="text"
                    value={form.original}
                    onChange={(e) => setForm((f) => ({ ...f, original: e.target.value }))}
                    placeholder="e.g. How are you?"
                    required
                  />
                </label>
                <label className="suggest-field">
                  <span>Your suggestion</span>
                  <textarea
                    value={form.suggestion}
                    onChange={(e) => setForm((f) => ({ ...f, suggestion: e.target.value }))}
                    placeholder="e.g. Kedu ka ị mere?"
                    rows={3}
                    required
                  />
                </label>
                <div className="suggest-form__actions">
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" disabled={busy}>
                    {busy ? "Submitting…" : "Submit suggestion"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {threadModalOpen && (
        <div
          className="suggest-modal-backdrop"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setThreadModalOpen(false)}
        >
          <div className="suggest-modal" role="dialog" aria-modal="true">
            <div className="suggest-modal__header">
              <h2>Start a forum thread</h2>
              <button type="button" className="suggest-modal__close" aria-label="Close" onClick={() => setThreadModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="suggest-form" onSubmit={handleSubmitThread}>
              <label className="suggest-field">
                <span>Title</span>
                <input
                  type="text"
                  value={threadForm.title}
                  onChange={(e) => setThreadForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className="suggest-field">
                <span>Tag</span>
                <select value={threadForm.tag} onChange={(e) => setThreadForm((f) => ({ ...f, tag: e.target.value }))}>
                  <option>Discussion</option>
                  <option>Igbo</option>
                  <option>Yoruba</option>
                  <option>Hausa</option>
                  <option>Swahili</option>
                </select>
              </label>
              <label className="suggest-field">
                <span>Message</span>
                <textarea
                  value={threadForm.body}
                  onChange={(e) => setThreadForm((f) => ({ ...f, body: e.target.value }))}
                  rows={4}
                />
              </label>
              <div className="suggest-form__actions">
                <button type="button" className="btn btn-outline" onClick={() => setThreadModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={busy}>
                  {busy ? "Creating…" : "Create thread"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          onClose={() => setReportTarget(null)}
        />
      )}
    </AppLayout>
  );
}
