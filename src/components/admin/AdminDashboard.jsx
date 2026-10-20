import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Languages,
  FileText,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Server,
  Megaphone,
} from "lucide-react";
import Logo from "../Logo";
import {
  fetchAdminAnnouncements,
  publishAdminAnnouncement,
  fetchAdminSubscriptions,
  fetchAdminPayments,
  fetchAdminUsers,
  fetchAdminStats,
  fetchAdminTranslations,
  fetchAdminAnalyticsActivity,
  fetchAdminAnalyticsTranslations,
} from "../../services/mockApi";
import { formatMoney } from "../../utils/entitlements";
import AnalyticsPage from "./AnalyticsPage";
import CommunityModerationPage from "./CommunityModerationPage";
import { getDateRangePreset, normalizeBarSeries, timeAgo } from "./analyticsUtils";
import "./AdminDashboard.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "translations", label: "Translations", icon: FileText },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "content", label: "Content", icon: BookOpen },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [section, setSection] = useState("dashboard");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announceActionUrl, setAnnounceActionUrl] = useState("/translate");
  const [announceBusy, setAnnounceBusy] = useState(false);
  const [announceError, setAnnounceError] = useState("");
  const [announceSuccess, setAnnounceSuccess] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [activityItems, setActivityItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [translationItems, setTranslationItems] = useState([]);
  const [translationAnalytics, setTranslationAnalytics] = useState(null);
  const [translationsLoading, setTranslationsLoading] = useState(false);

  useEffect(() => {
    if (section !== "dashboard") return;
    let cancelled = false;
    setDashboardLoading(true);
    const range = getDateRangePreset("7d");
    Promise.all([
      fetchAdminStats(range),
      fetchAdminAnalyticsActivity({ ...range, limit: 8 }),
    ])
      .then(([stats, activity]) => {
        if (!cancelled) {
          setAdminStats(stats);
          setActivityItems(activity.items || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdminStats(null);
          setActivityItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    if (section !== "announcements") return;
    let cancelled = false;
    setAnnouncementsLoading(true);
    fetchAdminAnnouncements()
      .then((data) => {
        if (!cancelled) setAnnouncements(data.announcements || []);
      })
      .catch((err) => {
        if (!cancelled) setAnnounceError(err?.message || "Unable to load announcements.");
      })
      .finally(() => {
        if (!cancelled) setAnnouncementsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, announceSuccess]);

  useEffect(() => {
    if (section !== "subscriptions") return;
    let cancelled = false;
    setSubsLoading(true);
    Promise.all([fetchAdminSubscriptions(), fetchAdminPayments()])
      .then(([subsData, payData]) => {
        if (!cancelled) {
          setSubscriptions(subsData.subscriptions || []);
          setPayments(payData.payments || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubscriptions([]);
          setPayments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    if (section !== "users") return;
    let cancelled = false;
    setUsersLoading(true);
    fetchAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data.users || []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  useEffect(() => {
    if (section !== "translations") return;
    let cancelled = false;
    setTranslationsLoading(true);
    const range = getDateRangePreset("30d");
    Promise.all([
      fetchAdminTranslations(100),
      fetchAdminAnalyticsTranslations(range),
    ])
      .then(([listData, analytics]) => {
        if (!cancelled) {
          setTranslationItems(listData.items || []);
          setTranslationAnalytics(analytics);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslationItems([]);
          setTranslationAnalytics(null);
        }
      })
      .finally(() => {
        if (!cancelled) setTranslationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

  async function handlePublishAnnouncement(e) {
    e.preventDefault();
    setAnnounceBusy(true);
    setAnnounceError("");
    setAnnounceSuccess("");
    try {
      const result = await publishAdminAnnouncement({
        title: announceTitle.trim(),
        message: announceMessage.trim(),
        actionUrl: announceActionUrl.trim() || null,
        audience: "all",
      });
      setAnnounceSuccess(
        `Published to ${result.announcement?.deliveredCount ?? 0} user(s).`
      );
      setAnnounceTitle("");
      setAnnounceMessage("");
      setAnnounceActionUrl("/translate");
    } catch (err) {
      setAnnounceError(err?.message || "Unable to publish announcement.");
    } finally {
      setAnnounceBusy(false);
    }
  }

  const billing = adminStats?.billing;

  const dashboardKpis = [
    { label: "Total users", value: String(adminStats?.users ?? "—"), icon: Users },
    { label: "Translations", value: String(adminStats?.translations ?? "—"), icon: FileText },
    {
      label: "Active subscriptions",
      value: String(billing?.activeSubscriptions ?? "—"),
      icon: CreditCard,
    },
    {
      label: "Total revenue",
      value:
        billing && billing.totalRevenueCents > 0
          ? formatMoney(billing.totalRevenueCents)
          : billing
            ? "No payments yet"
            : "—",
      icon: DollarSign,
    },
  ];

  const topLanguages = adminStats?.topLanguages || [];
  const systemStatus = adminStats?.system
    ? [
        { name: "API", ok: adminStats.system.api === "healthy", meta: adminStats.system.api },
        { name: "AI Engine", ok: adminStats.system.ai === "connected", meta: adminStats.system.ai },
        { name: "OCR", ok: adminStats.system.ocr === "connected", meta: adminStats.system.ocr },
        { name: "Database", ok: true, meta: adminStats.system.database },
      ]
    : [];

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <Logo size={28} showWordmark={false} />
          <div>
            <strong>Omummu</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="admin__nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin__nav-item ${section === item.id ? "is-active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <Link to="/translate" className="admin__exit">
          <LogOut size={16} /> Exit to app
        </Link>
      </aside>

      <main className="admin__main">
        <header className="admin__header">
          <div>
            <h1>{NAV.find((n) => n.id === section)?.label || "Dashboard"}</h1>
            <p>Omummu platform operations overview</p>
          </div>
          <div className="admin__live">
            <span className="admin__live-dot" /> LIVE
          </div>
        </header>

        {section === "dashboard" && (
          <>
            <div className="admin__kpis">
              {dashboardKpis.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="admin__kpi">
                    <div className="admin__kpi-top">
                      <span>{k.label}</span>
                      <Icon size={18} />
                    </div>
                    <strong>{dashboardLoading ? "…" : k.value}</strong>
                  </div>
                );
              })}
            </div>

            <div className="admin__grid">
              <section className="admin__card">
                <h2>Translations (7 days)</h2>
                {dashboardLoading ? (
                  <p className="admin__hint">Loading…</p>
                ) : (
                  <DashboardTranslationChart />
                )}
              </section>

              <section className="admin__card">
                <h2>Top languages</h2>
                {topLanguages.length === 0 ? (
                  <p className="admin__hint">No translation data yet.</p>
                ) : (
                  <ul className="admin__langs">
                    {topLanguages.map((l) => (
                      <li key={l.name}>
                        <div className="admin__lang-row">
                          <span>{l.name}</span>
                          <span>{l.pct}%</span>
                        </div>
                        <div className="admin__lang-track">
                          <div style={{ width: `${l.pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="admin__card">
                <h2>
                  <Activity size={16} /> Recent activity
                </h2>
                {activityItems.length === 0 ? (
                  <p className="admin__hint">No recent activity in the last 7 days.</p>
                ) : (
                  <ul className="admin__activity">
                    {activityItems.map((a) => (
                      <li key={a.id}>
                        <span>{a.text}</span>
                        <time>{timeAgo(a.createdAt)}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="admin__card">
                <h2>
                  <Server size={16} /> System status
                </h2>
                {systemStatus.length === 0 ? (
                  <p className="admin__hint">Unable to load system status.</p>
                ) : (
                  <ul className="admin__status">
                    {systemStatus.map((s) => (
                      <li key={s.name}>
                        {s.ok ? (
                          <CheckCircle2 size={16} className="ok" />
                        ) : (
                          <AlertTriangle size={16} className="warn" />
                        )}
                        <span>{s.name}</span>
                        <em>{s.meta}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        {section === "users" && (
          <section className="admin__card admin__table-card">
            <h2>User management</h2>
            {usersLoading ? (
              <p className="admin__hint">Loading…</p>
            ) : users.length === 0 ? (
              <p className="admin__hint">No users found.</p>
            ) : (
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id || u.email}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.plan}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {section === "subscriptions" && (
          <div className="admin__announce-grid">
            <section className="admin__card admin__table-card">
              <h2>Subscriptions</h2>
              {subsLoading ? (
                <p className="admin__hint">Loading…</p>
              ) : subscriptions.length === 0 ? (
                <p className="admin__hint">No subscription records yet.</p>
              ) : (
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Interval</th>
                      <th>Period end</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s.id || `${s.userId}-${s.stripeSubscriptionId}`}>
                        <td>{s.userName || s.userEmail}</td>
                        <td>{s.plan}</td>
                        <td>{s.status}</td>
                        <td>{s.billingInterval || "—"}</td>
                        <td>
                          {s.currentPeriodEnd
                            ? new Date(s.currentPeriodEnd).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="admin__card admin__table-card">
              <h2>Payment events</h2>
              {subsLoading ? (
                <p className="admin__hint">Loading…</p>
              ) : payments.length === 0 ? (
                <p className="admin__hint">No payment events yet.</p>
              ) : (
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{p.userName || p.userEmail || "—"}</td>
                        <td>{p.description || p.type}</td>
                        <td>{formatMoney(p.amountCents, p.currency)}</td>
                        <td>{p.status}</td>
                        <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {section === "translations" && (
          <div className="admin__announce-grid">
            <section className="admin__card">
              <h2>Translation analytics (30 days)</h2>
              {translationsLoading ? (
                <p className="admin__hint">Loading…</p>
              ) : (
                <>
                  <p className="admin__hint">
                    Total in range: {translationAnalytics?.summary?.totalInRange ?? 0} · All time:{" "}
                    {translationAnalytics?.summary?.totalAllTime ?? 0}
                  </p>
                  <ul className="admin__langs">
                    {(translationAnalytics?.breakdown?.modes || []).map((m) => (
                      <li key={m.label}>
                        <div className="admin__lang-row">
                          <span>{m.label}</span>
                          <span>{m.pct}%</span>
                        </div>
                        <div className="admin__lang-track">
                          <div style={{ width: `${m.pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="admin__card admin__table-card">
              <h2>Recent translations</h2>
              {translationsLoading ? (
                <p className="admin__hint">Loading…</p>
              ) : translationItems.length === 0 ? (
                <p className="admin__hint">No translations recorded yet.</p>
              ) : (
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Mode</th>
                      <th>Languages</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {translationItems.map((t) => (
                      <tr key={t.id}>
                        <td>{t.user_email || "—"}</td>
                        <td>{t.mode}</td>
                        <td>
                          {t.source_lang} → {t.target_lang}
                        </td>
                        <td>
                          {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}

        {section === "announcements" && (
          <div className="admin__announce-grid">
            <section className="admin__card">
              <h2>Publish announcement</h2>
              <p className="admin__hint">Sends an in-app notification to all users.</p>
              {announceError && <p className="admin__form-error">{announceError}</p>}
              {announceSuccess && <p className="admin__form-success">{announceSuccess}</p>}
              <form className="admin__announce-form" onSubmit={handlePublishAnnouncement}>
                <label>
                  Title
                  <input
                    type="text"
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    minLength={2}
                    required
                  />
                </label>
                <label>
                  Message
                  <textarea
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    rows={4}
                    minLength={2}
                    required
                  />
                </label>
                <label>
                  Action URL (optional)
                  <input
                    type="text"
                    value={announceActionUrl}
                    onChange={(e) => setAnnounceActionUrl(e.target.value)}
                    placeholder="/translate"
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={announceBusy}>
                  {announceBusy ? "Publishing…" : "Publish to all users"}
                </button>
              </form>
            </section>

            <section className="admin__card">
              <h2>Recent announcements</h2>
              {announcementsLoading ? (
                <p className="admin__hint">Loading…</p>
              ) : announcements.length === 0 ? (
                <p className="admin__hint">No announcements published yet.</p>
              ) : (
                <ul className="admin__announce-list">
                  {announcements.map((a) => (
                    <li key={a.id}>
                      <strong>{a.title}</strong>
                      <p>{a.message}</p>
                      <time>{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ""}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {section === "analytics" && <AnalyticsPage />}

        {section === "content" && <CommunityModerationPage />}

        {section !== "dashboard" &&
          section !== "users" &&
          section !== "announcements" &&
          section !== "subscriptions" &&
          section !== "translations" &&
          section !== "analytics" &&
          section !== "content" && (
          <section className="admin__card admin__placeholder">
            <h2>{NAV.find((n) => n.id === section)?.label}</h2>
            <p>This admin module will be wired in a future release.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function DashboardTranslationChart() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const range = getDateRangePreset("7d");
    fetchAdminAnalyticsTranslations({ ...range, granularity: "day" })
      .then((data) => setSeries(normalizeBarSeries(data.series, 7)))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin__hint">Loading…</p>;
  if (series.length === 0) {
    return <p className="admin__hint">No translations in the last 7 days.</p>;
  }

  return (
    <div className="admin__chart">
      {series.map((d) => (
        <div key={d.label} className="admin__bar-col">
          <div className="admin__bar" style={{ height: `${Math.max(d.height, 4)}%` }} />
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
