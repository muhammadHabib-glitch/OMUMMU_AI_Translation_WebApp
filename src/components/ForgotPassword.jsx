import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Logo from "./Logo";
import { forgotPassword } from "../services/mockApi";
import "./Signup.css";

const FEATURES = [
  "AI-powered translation",
  "Real-time voice & camera OCR",
  "Community-verified dialects",
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      sessionStorage.setItem("omummu_reset_email", data.email || email.trim().toLowerCase());
      navigate("/verify-reset-otp", {
        state: {
          email: data.email || email.trim().toLowerCase(),
          message: data.message || "Password reset code sent to your email.",
          purpose: "reset",
        },
      });
    } catch (err) {
      setError(err?.message || "Unable to send reset code.");
    } finally {
      setLoading(false);
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
          <h2>Forgot password</h2>
          <p className="signup-subtext">
            Enter your registered email and we&apos;ll send a 6-digit reset code.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="signup-label" htmlFor="forgot-email">
              EMAIL
            </label>
            <input
              id="forgot-email"
              className="signup-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {error ? <p className="signup-error">{error}</p> : null}

            <button type="submit" className="signup-submit" disabled={loading}>
              {loading ? "Sending code…" : "Send reset code"}
            </button>
          </form>

          <p className="signup-switch">
            Remembered it? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
