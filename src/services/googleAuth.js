import { apiRequest } from "./apiClient";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let scriptPromise = null;

function loadGoogleScript() {
  if (typeof window !== "undefined" && window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google sign-in.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function getGoogleSignInConfigMessage() {
  return (
    "Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to the frontend .env " +
    "and GOOGLE_CLIENT_ID to the backend .env (same OAuth Web client ID from Google Cloud Console)."
  );
}

async function fetchGoogleProfile(credential) {
  return apiRequest("/auth/google/email", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

function getHiddenButtonContainer() {
  let container = document.getElementById("google-signin-hidden");
  if (!container) {
    container = document.createElement("div");
    container.id = "google-signin-hidden";
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Opens Google account picker and returns verified email (and optional name).
 * Does NOT create a session — caller must complete email/password login.
 */
export async function pickGoogleAccount() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(getGoogleSignInConfigMessage());
  }

  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    let settled = false;

    function finish(err, data) {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(data);
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const profile = await fetchGoogleProfile(response.credential);
          finish(null, profile);
        } catch (err) {
          finish(err);
        }
      },
      cancel_on_tap_outside: true,
    });

    const container = getHiddenButtonContainer();
    container.innerHTML = "";
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
    });

    window.setTimeout(() => {
      const btn = container.querySelector('div[role="button"]');
      if (!btn) {
        finish(new Error("Could not open Google sign-in. Please try again."));
        return;
      }
      btn.click();
    }, 50);
  });
}
