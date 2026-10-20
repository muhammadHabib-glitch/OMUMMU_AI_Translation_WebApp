import { useCallback, useEffect, useState } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  fetchPaymentHistory,
  fetchSubscriptionStatus,
} from "../services/mockApi";
import { formatMoney, isPremiumUser } from "../utils/entitlements";
import "./SubscriptionSection.css";

export default function SubscriptionSection({ checkoutAvailable, onUpgrade }) {
  const [status, setStatus] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sub, history] = await Promise.all([
        fetchSubscriptionStatus(),
        fetchPaymentHistory({ limit: 10 }),
      ]);
      setStatus(sub);
      setPayments(history.payments || []);
    } catch (err) {
      setError(err?.message || "Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePortal() {
    setBusy(true);
    setError("");
    try {
      const { url } = await createBillingPortalSession();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err?.message || "Unable to open billing portal.");
    } finally {
      setBusy(false);
    }
  }

  const premium = isPremiumUser(status);
  const sub = status?.subscription;

  if (loading) {
    return <div className="subscription-section subscription-section--loading">Loading subscription…</div>;
  }

  return (
    <section className="subscription-section">
      <div className="subscription-section__header">
        <h3>Subscription</h3>
        {premium ? (
          <span className="subscription-section__badge is-premium">Premium active</span>
        ) : (
          <span className="subscription-section__badge">Free plan</span>
        )}
      </div>

      {error && <p className="subscription-section__error">{error}</p>}

      {premium && sub && (
        <div className="subscription-section__meta">
          {sub.billingInterval && (
            <p>
              Billing: <strong>{sub.billingInterval === "year" ? "Annual" : "Monthly"}</strong>
            </p>
          )}
          {sub.currentPeriodEnd && (
            <p>
              {sub.cancelAtPeriodEnd ? "Access until" : "Renews"}:{" "}
              <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</strong>
            </p>
          )}
          {sub.cancelAtPeriodEnd && (
            <p className="subscription-section__hint">Cancellation scheduled at period end.</p>
          )}
        </div>
      )}

      <div className="subscription-section__actions">
        {premium ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePortal}
            disabled={busy || !checkoutAvailable}
            title={!checkoutAvailable ? "Billing portal requires Stripe configuration" : undefined}
          >
            {busy ? "Opening…" : "Manage billing"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onUpgrade}
            disabled={busy}
          >
            Upgrade to Premium
          </button>
        )}
      </div>

      {payments.length > 0 && (
        <div className="subscription-section__history">
          <h4>Payment history</h4>
          <ul>
            {payments.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.description || p.type}</strong>
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <em>
                  {formatMoney(p.amountCents, p.currency)} · {p.status}
                </em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
