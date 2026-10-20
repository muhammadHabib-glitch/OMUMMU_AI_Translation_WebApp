import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check } from "lucide-react";
import Logo from "./Logo";
import { register } from "../services/mockApi";
import { pickGoogleAccount, isGoogleSignInConfigured, getGoogleSignInConfigMessage } from "../services/googleAuth";
import "./Signup.css";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

const FEATURES = [
  "AI-powered translation",
  "Real-time voice & camera OCR",
  "Community-verified dialects",
];

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleHint, setGoogleHint] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await register({ name, email, password });
      sessionStorage.setItem("omummu_pending_email", data.email || email.trim());
      navigate("/verify-otp", {
        state: {
          email: data.email || email.trim().toLowerCase(),
          message: data.message || "Verification code sent to your email.",
        },
      });
    } catch (err) {
      setError(err?.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleHint("");
    if (!isGoogleSignInConfigured()) {
      setError(getGoogleSignInConfigMessage());
      return;
    }
    setGoogleLoading(true);
    try {
      const profile = await pickGoogleAccount();
      setEmail(profile.email);
      if (profile.name) setName(profile.name);
      setGoogleHint("Details filled from Google. Complete the form and create your account.");
    } catch (err) {
      if (err?.message && !/popup|closed|cancel/i.test(err.message)) {
        setError(err.message || "Could not use Google account. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <aside className="signup-left">
        <div className="signup-left__top">
          <Logo size={40} wordmarkClass="signup-logo-wordmark" />
        </div>
        <div className="signup-left__content">
          <h1>
            Empowering
            <br />
            African Languages
          </h1>
          <p>
            Translate, learn, and connect across 100+ languages including Igbo,
            Yoruba, Hausa, and Swahili.
          </p>
          <ul className="signup-features">
            {FEATURES.map((item) => (
              <li key={item}>
                <span className="signup-check">
                  <Check size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="signup-copyright">© 2024 Omummu</p>
      </aside>

      <main className="signup-right">
        <div className="signup-form-wrap">
          <h2>Create your account</h2>
          <p className="signup-subtext">
            Join Omummu — free to start, sync across all devices
          </p>
          {googleHint ? <p className="login-success">{googleHint}</p> : null}

          <div className="signup-social-row">
            <button
              type="button"
              className="signup-social"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <GoogleIcon />
              {googleLoading ? "Selecting account…" : "Google"}
            </button>
            <button type="button" className="signup-social">
              <AppleIcon />
              Apple
            </button>
          </div>

          <div className="signup-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="signup-label" htmlFor="signup-name">
              FULL NAME
            </label>
            <input
              id="signup-name"
              className="signup-input"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />

            <label className="signup-label" htmlFor="signup-email">
              EMAIL
            </label>
            <input
              id="signup-email"
              className="signup-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label className="signup-label" htmlFor="signup-password">
              PASSWORD
            </label>
            <div className="signup-password">
              <input
                id="signup-password"
                className="signup-input"
                type={showPass ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-eye"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="signup-label" htmlFor="signup-confirm">
              CONFIRM PASSWORD
            </label>
            <div className="signup-password">
              <input
                id="signup-confirm"
                className="signup-input"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="signup-eye"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="signup-error">{error}</p>}

            <button type="submit" className="signup-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="signup-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <p className="signup-terms">
            By creating an account, you agree to our{" "}
            <a href="#terms">Terms of Service</a> and{" "}
            <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </main>
    </div>
  );
}
