import { useState } from "react";
import { createCheckoutSession } from "../services/mockApi";
import { formatMoney } from "../utils/entitlements";
import "./UpgradeModal.css";

export default function UpgradeModal({ open, onClose, plans = [], checkoutAvailable }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const paidPlans = plans.filter(
    (p) => p.id !== "free" && p.interval !== "year" && p.id !== "premium_annual"
  );

  async function handleCheckout(plan) {
    if (!checkoutAvailable) {
      setError("Billing is not configured on this server yet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = plan.stripePriceId
        ? { priceId: plan.stripePriceId }
        : { interval: plan.interval };
      const { url } = await createCheckoutSession(payload);
      if (url) window.location.href = url;
    } catch (err) {
      setError(err?.message || "Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upgrade-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="upgrade-modal"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-modal-title">Upgrade to Omummu Premium</h2>
        <p className="upgrade-modal__intro">
          Unlock document translation, premium courses, and more.
        </p>

        {!checkoutAvailable && (
          <p className="upgrade-modal__notice">
            Stripe billing is not configured yet. Contact your administrator to enable payments.
          </p>
        )}

        {error && <p className="upgrade-modal__error">{error}</p>}

        <div className="upgrade-modal__plans">
          {paidPlans.map((plan) => (
            <div key={plan.id} className="upgrade-modal__plan">
              <div>
                <strong>Omummu Premium</strong>
                <span>
                  {plan.amount != null
                    ? `${formatMoney(plan.amount, plan.currency)} / month`
                    : "Pricing unavailable"}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy || !checkoutAvailable || plan.amount == null}
                onClick={() => handleCheckout(plan)}
              >
                {busy ? "Redirecting…" : "Subscribe monthly"}
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-outline btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
