import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminAnalyticsOverview,
  fetchAdminAnalyticsUsers,
  fetchAdminAnalyticsTranslations,
  fetchAdminAnalyticsLearning,
  fetchAdminAnalyticsAi,
  fetchAdminAnalyticsFeatures,
  fetchAdminAnalyticsSubscriptions,
} from "../../services/mockApi";
import { formatMoney } from "../../utils/entitlements";
import { getDateRangePreset, normalizeBarSeries } from "./analyticsUtils";
import "./AnalyticsPage.css";

const PRESETS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];

function KpiCard({ label, value, hint }) {
  return (
    <div className="admin__kpi analytics-kpi">
      <div className="admin__kpi-top">
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function BarChart({ title, series, emptyLabel }) {
  const bars = normalizeBarSeries(series);
  return (
    <section className="admin__card analytics-card">
      <h2>{title}</h2>
      {bars.length === 0 ? (
        <p className="admin__hint">{emptyLabel || "No data in selected range."}</p>
      ) : (
        <div className="admin__chart">
          {bars.map((d) => (
            <div key={d.label} className="admin__bar-col">
              <div className="admin__bar" style={{ height: `${Math.max(d.height, 4)}%` }} title={String(d.value)} />
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BreakdownList({ title, items }) {
  return (
    <section className="admin__card analytics-card">
      <h2>{title}</h2>
      {!items?.length ? (
        <p className="admin__hint">No data in selected range.</p>
      ) : (
        <ul className="admin__langs">
          {items.map((l) => (
            <li key={l.label || l.feature || l.name}>
              <div className="admin__lang-row">
                <span>{l.label || l.feature || l.name}</span>
                <span>{l.pct != null ? `${l.pct}%` : l.count}</span>
              </div>
              <div className="admin__lang-track">
                <div style={{ width: `${l.pct || 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FeatureTable({ features }) {
  return (
    <section className="admin__card admin__table-card analytics-card">
      <h2>Feature usage ranking</h2>
      {!features?.length ? (
        <p className="admin__hint">No feature activity in selected range.</p>
      ) : (
        <table className="admin__table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Category</th>
              <th>Count</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.feature}>
                <td>{f.feature}</td>
                <td>{f.category}</td>
                <td>{f.count}</td>
                <td>{f.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState("30d");
  const [range, setRange] = useState(() => getDateRangePreset("30d"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [learning, setLearning] = useState(null);
  const [ai, setAi] = useState(null);
  const [features, setFeatures] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const q = { from: range.from, to: range.to, granularity: "day" };
    try {
      const [ov, u, t, l, a, f, s] = await Promise.all([
        fetchAdminAnalyticsOverview(q),
        fetchAdminAnalyticsUsers(q),
        fetchAdminAnalyticsTranslations(q),
        fetchAdminAnalyticsLearning(q),
        fetchAdminAnalyticsAi(q),
        fetchAdminAnalyticsFeatures(q),
        fetchAdminAnalyticsSubscriptions(q),
      ]);
      setOverview(ov);
      setUsers(u);
      setTranslations(t);
      setLearning(l);
      setAi(a);
      setFeatures(f);
      setSubscriptions(s);
    } catch (err) {
      setError(err?.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePreset(id) {
    setPreset(id);
    setRange(getDateRangePreset(id));
  }

  const summary = overview?.summary || {};

  return (
    <div className="analytics-page">
      <div className="analytics-toolbar">
        <div className="analytics-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`btn btn-sm ${preset === p.id ? "btn-primary" : "btn-outline"}`}
              onClick={() => handlePreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="analytics-error">
          <p>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <p className="admin__hint">Loading analytics…</p>
      ) : (
        <>
          <div className="admin__kpis analytics-kpis">
            <KpiCard label="Total users" value={summary.totalUsers ?? "—"} />
            <KpiCard label="Active users" value={summary.activeUsers ?? "—"} hint="Activity-based" />
            <KpiCard label="New users" value={summary.newUsers ?? "—"} />
            <KpiCard label="Translations" value={summary.totalTranslations ?? "—"} />
            <KpiCard label="Learn sessions" value={summary.learnSessions ?? "—"} />
            <KpiCard label="AI messages" value={summary.assistantMessages ?? "—"} />
            <KpiCard
              label="Revenue"
              value={
                summary.hasPaymentData
                  ? formatMoney(summary.totalRevenueCents || 0)
                  : "No payments yet"
              }
            />
            <KpiCard label="Active subs" value={summary.activeSubscriptions ?? "—"} />
          </div>

          {!overview?.hasData && (
            <section className="admin__card analytics-empty">
              <h2>No platform activity yet</h2>
              <p>Analytics will populate as users translate, learn, and engage with the platform.</p>
            </section>
          )}

          <div className="admin__grid">
            <BarChart title="Translation volume" series={translations?.series} />
            <BarChart title="New user signups" series={users?.series?.newUsers} />
            <BreakdownList
              title="Top target languages"
              items={translations?.breakdown?.targetLanguages}
            />
            <BreakdownList title="Translation types" items={translations?.breakdown?.modes} />
          </div>

          <div className="admin__grid">
            <section className="admin__card analytics-card">
              <h2>Learning & engagement</h2>
              <ul className="analytics-metrics-list">
                <li>
                  <span>Lessons completed</span>
                  <strong>{learning?.summary?.lessonsCompletedInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Quiz attempts</span>
                  <strong>{learning?.summary?.quizAttemptsInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Quiz pass rate</span>
                  <strong>{learning?.summary?.quizPassRate ?? 0}%</strong>
                </li>
                <li>
                  <span>Vocabulary saved</span>
                  <strong>{learning?.summary?.vocabularySavedInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Total platform XP</span>
                  <strong>{learning?.summary?.totalXp ?? 0}</strong>
                </li>
                <li>
                  <span>Badges earned</span>
                  <strong>{learning?.summary?.badgesEarnedInRange ?? 0}</strong>
                </li>
              </ul>
            </section>

            <section className="admin__card analytics-card">
              <h2>AI usage (counts)</h2>
              <ul className="analytics-metrics-list">
                <li>
                  <span>Assistant conversations</span>
                  <strong>{ai?.summary?.assistantConversationsInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Assistant messages</span>
                  <strong>{ai?.summary?.assistantMessagesInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Speaking sessions</span>
                  <strong>{ai?.summary?.speakingSessionsInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Learn conversations</span>
                  <strong>{ai?.summary?.learnConversationSessionsInRange ?? 0}</strong>
                </li>
              </ul>
              {ai?.notes?.[0] && <p className="admin__hint analytics-note">{ai.notes[0]}</p>}
            </section>

            <section className="admin__card analytics-card">
              <h2>Subscriptions & revenue</h2>
              <ul className="analytics-metrics-list">
                <li>
                  <span>Free users</span>
                  <strong>{subscriptions?.summary?.freeUsers ?? 0}</strong>
                </li>
                <li>
                  <span>Premium users</span>
                  <strong>{subscriptions?.summary?.premiumUsers ?? 0}</strong>
                </li>
                <li>
                  <span>New subscriptions</span>
                  <strong>{subscriptions?.summary?.newSubscriptionsInRange ?? 0}</strong>
                </li>
                <li>
                  <span>Revenue in range</span>
                  <strong>
                    {subscriptions?.hasData
                      ? formatMoney(subscriptions?.summary?.revenueInRangeCents || 0)
                      : "—"}
                  </strong>
                </li>
              </ul>
              {!subscriptions?.hasData && (
                <p className="admin__hint">No payment data recorded yet. Revenue appears after real Stripe payments.</p>
              )}
            </section>

            <BreakdownList
              title="User plan split"
              items={subscriptions?.breakdown?.userPlan || users?.breakdown?.planSplit}
            />
          </div>

          <FeatureTable features={features?.features} />
        </>
      )}
    </div>
  );
}
