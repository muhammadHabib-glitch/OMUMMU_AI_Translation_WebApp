import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "./AppLayout";
import { fetchProfile, fetchSubscriptionStatus } from "../services/mockApi";
import { getToken, setSession } from "../services/apiClient";
import { isPremiumUser } from "../utils/entitlements";

export default function BillingSuccess() {
  const [message, setMessage] = useState("Confirming your subscription…");

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      try {
        await fetchSubscriptionStatus();
        const profile = await fetchProfile();
        const token = getToken();
        if (token && profile?.user) {
          setSession({ token, user: profile.user });
          window.dispatchEvent(new Event("omummu:session-updated"));
        }
        if (!cancelled) {
          setMessage(
            isPremiumUser(profile?.user)
              ? "Premium is active. Thank you for upgrading!"
              : "Payment received. Your plan will update shortly once confirmed."
          );
        }
      } catch {
        if (!cancelled) setMessage("Payment received. Check your profile for subscription status.");
      }
    }
    confirm();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <div className="page-container" style={{ paddingTop: "2rem", maxWidth: 560 }}>
        <h1>Subscription confirmed</h1>
        <p>{message}</p>
        <Link to="/profile" className="btn btn-primary">
          Go to profile
        </Link>
      </div>
    </AppLayout>
  );
}
