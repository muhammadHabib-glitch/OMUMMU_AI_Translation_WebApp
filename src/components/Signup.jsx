import React, { useState } from "react";
import "./Signup.css";
import googleLogo from '../assets/Logos/google.png';
import appleLogo from '../assets/Logos/apple.png';

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="signup-page">
      {/* LEFT PANEL */}
      <div className="signup-left">
        <div className="left-content">
          <h1 className="left-title">
            Empowering
            <br />
            African Languages
          </h1>
          <p className="left-desc">
            Translate, learn, and connect across 100+ 
            <br />languages including Igbo, Yoruba, Hausa,
            <br /> and Swahili.
          </p>

          <ul className="feature-list">
            <li>
              <span className="check-icon">&#10003;</span>
              AI-powered translation
            </li>
            <li>
              <span className="check-icon">&#10003;</span>
              Real-time voice &amp; camera OCR
            </li>
            <li>
              <span className="check-icon">&#10003;</span>
              Community-verified dialects
            </li>
          </ul>
        </div>

        <div className="left-footer">© 2024 Omummu</div>
      </div>  

      {/* RIGHT PANEL */}
      <div className="signup-right">
        <div className="right-content">
          <h2 className="form-title">Create your account</h2>
          <p className="form-subtitle">
            Join Omummu — free to start, sync across all devices
          </p>

          <div className="social-buttons">
            <button type="button" className="social-btn google-btn">
              <img src={googleLogo} alt="Google" className="social-icon" />
              Google
            </button>
            <button type="button" className="social-btn apple-btn">
              <img src={appleLogo} alt="Apple" className="social-icon" />
              Apple
            </button>
          </div>

          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          <form className="signup-form">
            <div className="form-group">
              <label htmlFor="fullName">FULL NAME</label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">EMAIL</label>
              <input id="email" type="email" placeholder="you@email.com" />
            </div>

            <div className="form-group">
              <label htmlFor="password">PASSWORD</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Create a password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPass(!showPass)}
                >
                  👁
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  👁
                </span>
              </div>
            </div>

            <button type="button" className="create-account-btn">
              Create Account
            </button>
          </form>

          <p className="signin-text">
            Already have an account? <a href="#">Sign in</a>
          </p>

          <p className="terms-text">
            By creating an account, you agree to our
            <br />
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}