import React from "react";
import "./Navbar.css";
import logo from "../assets/logo.png";
import avatar from "../assets/avatar.png";
import notification from "../assets/notification.png";

function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Omummu" className="navbar-logo" />
        <span className="navbar-brand">Omummu</span>
      </div>

      <ul className="navbar-links">
        <li className="active">Translate</li>
        <li>AI Assistant</li>
        <li>Learn</li>
        <li>Community</li>
        <li>History</li>
      </ul>

      <div className="navbar-right">
        <span className="navbar-bell">
            <img src={notification} alt="Notifications" className="notification-icon" />
        </span>
        <img src={avatar} alt="User" className="navbar-avatar" />
        
      </div>
    </div>
  );
}

export default Navbar;