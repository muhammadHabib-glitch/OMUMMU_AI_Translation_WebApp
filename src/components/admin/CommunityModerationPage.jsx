import { useEffect, useState } from "react";
import {
  fetchAdminCommunityOverview,
  fetchAdminCommunityReports,
  fetchAdminCommunityPosts,
  moderateCommunityPost,
  resolveCommunityReport,
  fetchAdminCommunityModerationLog,
} from "../../services/mockApi";
import "./CommunityModerationPage.css";

export default function CommunityModerationPage() {
  const [tab, setTab] = useState("reports");
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [ov, rep, pst, lg] = await Promise.all([
        fetchAdminCommunityOverview(),
        fetchAdminCommunityReports("open"),
        fetchAdminCommunityPosts({ limit: 50 }),
        fetchAdminCommunityModerationLog(30),
      ]);
      setOverview(ov.overview || null);
      setReports(rep.reports || []);
      setPosts(pst.posts || []);
      setLog(lg.items || []);
    } catch (err) {
      setError(err?.message || "Unable to load community moderation data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleModeratePost(postId, action) {
    setBusyId(postId);
    try {
      await moderateCommunityPost(postId, action);
      await load();
    } catch (err) {
      setError(err?.message || "Moderation action failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolveReport(reportId, action, hideContent = false) {
    setBusyId(reportId);
    try {
      await resolveCommunityReport(reportId, {
        action,
        resolutionNote: action === "resolve" ? "Reviewed by admin" : undefined,
        moderateTarget: hideContent && action === "resolve" ? { action: "hide" } : undefined,
      });
      await load();
    } catch (err) {
      setError(err?.message || "Could not update report.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="community-mod">
      <header className="community-mod__header">
        <h2>Community moderation</h2>
        <p>Review reports, manage posts, and audit moderation actions.</p>
      </header>

      {error && <p className="community-mod__error">{error}</p>}

      {overview && (
        <div className="community-mod__kpis">
          <div className="community-mod__kpi">
            <span>Corrections</span>
            <strong>{overview.corrections ?? 0}</strong>
          </div>
          <div className="community-mod__kpi">
            <span>Threads</span>
            <strong>{overview.threads ?? 0}</strong>
          </div>
          <div className="community-mod__kpi">
            <span>Open reports</span>
            <strong>{overview.open_reports ?? 0}</strong>
          </div>
          <div className="community-mod__kpi">
            <span>Hidden</span>
            <strong>{overview.hidden_content ?? 0}</strong>
          </div>
        </div>
      )}

      <div className="community-mod__tabs">
        {["reports", "posts", "log"].map((id) => (
          <button
            key={id}
            type="button"
            className={`community-mod__tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {id === "reports" ? "Open reports" : id === "posts" ? "All posts" : "Moderation log"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="community-mod__hint">Loading…</p>
      ) : (
        <>
          {tab === "reports" && (
            <section className="admin__card community-mod__panel">
              {reports.length === 0 ? (
                <p className="community-mod__hint">No open reports.</p>
              ) : (
                <ul className="community-mod__list">
                  {reports.map((r) => (
                    <li key={r.id} className="community-mod__item">
                      <div>
                        <strong>{r.targetType}</strong> · {r.reason}
                        <p className="community-mod__meta">Reported {new Date(r.createdAt).toLocaleString()}</p>
                        {r.details && <p>{r.details}</p>}
                      </div>
                      <div className="community-mod__actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busyId === r.id}
                          onClick={() => handleResolveReport(r.id, "dismiss")}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busyId === r.id}
                          onClick={() => handleResolveReport(r.id, "resolve", true)}
                        >
                          Resolve & hide
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "posts" && (
            <section className="admin__card community-mod__panel">
              {posts.length === 0 ? (
                <p className="community-mod__hint">No posts found.</p>
              ) : (
                <ul className="community-mod__list">
                  {posts.map((p) => (
                    <li key={p.id} className="community-mod__item">
                      <div>
                        <strong>{p.postType}</strong> · {p.status}
                        <p>{p.postType === "thread" ? p.title : `${p.original} → ${p.suggestion}`}</p>
                        <p className="community-mod__meta">
                          {p.userName} · {p.lang} · {new Date(p.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="community-mod__actions">
                        {p.status !== "hidden" && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busyId === p.id}
                            onClick={() => handleModeratePost(p.id, "hide")}
                          >
                            Hide
                          </button>
                        )}
                        {p.status === "hidden" && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busyId === p.id}
                            onClick={() => handleModeratePost(p.id, "restore")}
                          >
                            Restore
                          </button>
                        )}
                        {p.status !== "removed" && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busyId === p.id}
                            onClick={() => handleModeratePost(p.id, "remove")}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "log" && (
            <section className="admin__card community-mod__panel">
              {log.length === 0 ? (
                <p className="community-mod__hint">No moderation actions yet.</p>
              ) : (
                <ul className="community-mod__list community-mod__list--compact">
                  {log.map((item) => (
                    <li key={item.id}>
                      <strong>{item.action}</strong> on {item.targetType} {item.targetId?.slice?.(0, 8)}…
                      <span className="community-mod__meta">{new Date(item.createdAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
