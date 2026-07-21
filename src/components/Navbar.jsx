import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logo.png";
import avatar from "../assets/avatar.png";
import notification from "../assets/notification.png";

const LINKS = [
  { to: "/translate", label: "Translate" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/learn", label: "Learn" },
  { to: "/community", label: "Community" },
  { to: "/history", label: "History" },
];

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Omummu" className="navbar-logo" />
        <span className="navbar-brand">Omummu</span>
      </div>

      <ul className="navbar-links">
        {LINKS.map((l) => (
          <li key={l.to} className={pathname === l.to ? "active" : ""}>
            <Link to={l.to} style={{ color: "inherit", textDecoration: "none" }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-right">
        {/* <Link to="/login"><button>Login</button></Link>
        <Link to="/signup"><button>Signup</button></Link> */}

        <span className="navbar-bell">
          <img src={notification} alt="Notifications" className="notification-icon" />
        </span>

        <div style={{ position: "relative" }}>
          <img
            src={avatar}
            alt="User"
            className="navbar-avatar"
            onClick={() => setDropdownOpen((v) => !v)}
            style={{ cursor: "pointer" }}
          />
          {dropdownOpen && (
            <ul className="avatar-dropdown">
              <li><Link to="/history" style={{ color: "inherit", textDecoration: "none" }}>History</Link></li>
              <li><Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>Logout</Link></li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;












// import React from "react";
// import "./Navbar.css";
// import logo from "../assets/logo.png";
// import avatar from "../assets/avatar.png";
// import notification from "../assets/notification.png";

// function Navbar() {
//   return (
//     <div className="navbar">
//       <div className="navbar-left">
//         <img src={logo} alt="Omummu" className="navbar-logo" />
//         <span className="navbar-brand">Omummu</span>
//       </div>

//       <ul className="navbar-links">
//         <li className="active">Translate</li>
//         <li>AI Assistant</li>
//         <li>Learn</li>
//         <li>Community</li>
//         <li>History</li>
//       </ul>

//       <div className="navbar-right">
//         <span className="navbar-bell">
//             <img src={notification} alt="Notifications" className="notification-icon" />
//         </span>
//         <img src={avatar} alt="User" className="navbar-avatar" />
        
//       </div>
//     </div>
//   );
// }

// export default Navbar;