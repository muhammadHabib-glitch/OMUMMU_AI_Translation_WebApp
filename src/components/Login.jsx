import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import googleLogo from "../assets/Logos/google.png";
import appleLogo from "../assets/Logos/apple.png";

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">Omummu</div>
        <div className="login-left-content">
          <h1>Empowering African Languages</h1>
          <p>
            Translate, learn, and connect across 100+ languages including Igbo,
            Yoruba, Hausa, and Swahili.
          </p>
          <ul className="login-features">
            <li>
              <span className="check-icon">✓</span> AI-powered translation
            </li>
            <li>
              <span className="check-icon">✓</span> Real-time voice &amp; camera
              OCR
            </li>
            <li>
              <span className="check-icon">✓</span> Community-verified dialects
            </li>
          </ul>
        </div>
        <div className="login-copyright">© 2024 Omummu</div>
      </div>

      <div className="login-right">
        <div className="login-form-wrapper">
          <h2>Welcome back</h2>
          <p className="login-subtext">
            Sign in to sync translations across devices
          </p>

           <div className="btn btn-google">
            <img src={googleLogo} alt="Google" className="google-icon" />
            Continue with Google
          </div>

          <div className="btn btn-apple">
            <img src={appleLogo} alt="Apple" className="apple-icon" />
            Continue with Apple
          </div>
          <div className="divider">
            <span>OR</span>
          </div>

          <form>
            <label className="field-label" htmlFor="email">
              EMAIL
            </label>
            <input id="email" type="email" placeholder="name@email.com" />

            <div className="field-label-row">
              <label className="field-label" htmlFor="password">
                PASSWORD
              </label>
              <a href="#" className="forgot-link">
                Forgot password?
              </a>
            </div>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="************"
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁️
              </span>
            </div>

            <button type="submit" className="btn btn-signin">
              Sign In
            </button>
          </form>

          <p className="signup-text">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>

          <p className="terms-text">
            By continuing, you agree to <a href="#">Terms</a> &amp;{" "}
            <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;