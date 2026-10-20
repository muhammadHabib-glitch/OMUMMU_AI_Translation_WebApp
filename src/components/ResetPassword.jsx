import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff } from "lucide-react";
import Logo from "./Logo";
import { resetPassword } from "../services/mockApi";
import "./Signup.css";

const FEATURES = [
  "AI-powered translation",
  "Real-time voice & camera OCR",
  "Community-verified dialects",
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email =
    location.state?.email || sessionStorage.getItem("omummu_reset_email") || "";
  const resetToken =
    location.state?.resetToken || sessionStorage.getItem("omummu_reset_token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email || !resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, resetToken, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await resetPassword({
        email,
        resetToken,
        password,
        confirmPassword: confirm,
      });
      sessionStorage.removeItem("omummu_reset_token");
      sessionStorage.removeItem("omummu_reset_email");
      navigate("/login", {
        replace: true,
        state: {
          email,
          message: data.message || "Password updated. Please sign in.",
        },
      });
    } catch (err) {
      setError(err?.message || "Unable to update password.");
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
          <h2>Reset password</h2>
          <p className="signup-subtext">
            Create a new password for <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="signup-label" htmlFor="reset-password">
              NEW PASSWORD
            </label>
            <div className="signup-password">
              <input
                id="reset-password"
                className="signup-input"
                type={showPass ? "text" : "password"}
                placeholder="Create a new password"
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

            <label className="signup-label" htmlFor="reset-confirm">
              CONFIRM NEW PASSWORD
            </label>
            <div className="signup-password">
              <input
                id="reset-confirm"
                className={`signup-input${confirm && confirm === password ? " is-match" : ""}`}
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your new password"
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

            {error ? <p className="signup-error">{error}</p> : null}

            <button type="submit" className="signup-submit" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          <p className="signup-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
