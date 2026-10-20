import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Logo from "./Logo";
import { verifyResetOtp, resendResetOtp } from "../services/mockApi";
import "./VerifyOtp.css";

const FEATURES = [
  "AI-powered translation",
  "Real-time voice & camera OCR",
  "Community-verified dialects",
];

const OTP_LEN = 6;

export default function VerifyResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email =
    location.state?.email || sessionStorage.getItem("omummu_reset_email") || "";
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    location.state?.message || "Enter the 6-digit reset code we sent to your email."
  );
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function setDigitAt(index, value) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < OTP_LEN - 1) inputsRef.current[index + 1]?.focus();
  }

  function onKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!pasted) return;
    const next = Array(OTP_LEN).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const otp = digits.join("");
    if (otp.length !== OTP_LEN) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyResetOtp({ email, otp });
      sessionStorage.setItem("omummu_reset_token", data.resetToken);
      sessionStorage.setItem("omummu_reset_email", data.email || email);
      navigate("/reset-password", {
        replace: true,
        state: {
          email: data.email || email,
          resetToken: data.resetToken,
          message: data.message,
        },
      });
    } catch (err) {
      setError(err?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setError("");
    setResending(true);
    try {
      const data = await resendResetOtp(email);
      setInfo(data.message || "A new code was sent.");
      setCooldown(data.cooldownSeconds || 60);
      setDigits(Array(OTP_LEN).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Unable to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="otp-page">
      <aside className="otp-left">
        <div className="otp-left__top">
          <Logo size={40} wordmarkClass="otp-logo-wordmark" />
        </div>
        <div className="otp-left__content">
          <h1>
            Empowering
            <br />
            African Languages
          </h1>
          <p>
            Translate, learn, and connect across 100+ languages including Igbo,
            Yoruba, Hausa, and Swahili.
          </p>
          <ul className="otp-features">
            {FEATURES.map((item) => (
              <li key={item}>
                <span className="otp-check">
                  <Check size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="otp-copyright">© 2024 Omummu</p>
      </aside>

      <main className="otp-right">
        <div className="otp-form-wrap">
          <h2>Verify reset code</h2>
          <p className="otp-subtext">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <p className="otp-hint">{info}</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="otp-boxes" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  className="otp-box"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigitAt(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error ? <p className="otp-error">{error}</p> : null}

            <button type="submit" className="otp-submit" disabled={loading}>
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
          </form>

          <p className="otp-resend">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
            >
              {resending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend OTP"}
            </button>
          </p>

          <p className="otp-switch">
            <Link to="/forgot-password">Use a different email</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
