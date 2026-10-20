import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import Logo from "./Logo";
import UserAvatar from "./UserAvatar";
import NotificationPanel from "./NotificationPanel";
import { clearSession, getToken, getStoredUser } from "../services/apiClient";
import { fetchUnreadNotificationCount } from "../services/mockApi";
import "./Navbar.css";
const LINKS = [
  { to: "/translate", label: "Translate", match: ["/translate", "/"] },
  { to: "/assistant", label: "AI Assistant", match: ["/assistant"] },
  { to: "/learn", label: "Learn", match: ["/learn"] },
  { to: "/community", label: "Community", match: ["/community"] },
  { to: "/history", label: "History", match: ["/history"] },
];

export default function Navbar({ showLogin = true }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const loggedIn = Boolean(getToken());

  const refreshUnreadCount = useCallback(async () => {
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await fetchUnreadNotificationCount();
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function refreshUser() {
      setUser(getToken() ? getStoredUser() : null);
    }
    refreshUser();
    window.addEventListener("omummu:session-updated", refreshUser);
    window.addEventListener("storage", refreshUser);
    return () => {
      window.removeEventListener("omummu:session-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, [pathname]);

  useEffect(() => {
    refreshUnreadCount();
    window.addEventListener("omummu:session-updated", refreshUnreadCount);
    return () => window.removeEventListener("omummu:session-updated", refreshUnreadCount);
  }, [pathname, refreshUnreadCount, loggedIn]);

  useEffect(() => {
    function onOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (link) => link.match.some((m) => (m === "/" ? pathname === "/" : pathname.startsWith(m)));

  function handleLogout() {
    setDropdownOpen(false);
    setMobileOpen(false);
    clearSession();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/translate" className="navbar__brand">
          <Logo size={36} />
        </Link>

        <nav className="navbar__links" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={`navbar__link ${isActive(l) ? "is-active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="navbar__right">
          {loggedIn && (
            <div className="navbar__notif-wrap" ref={notifRef}>
              <button
                type="button"
                className="navbar__icon-btn"
                aria-label="Notifications"
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setDropdownOpen(false);
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="navbar__notif-badge" aria-hidden="true">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                onUnreadChange={setUnreadCount}
              />
            </div>
          )}

          {loggedIn ? (
            <div className="navbar__avatar-wrap" ref={dropRef}>
              <button
                type="button"
                className="navbar__avatar"
                aria-label="Account menu"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((v) => !v)}
              >
                <UserAvatar user={user} size={36} />
              </button>
              {dropdownOpen && (
                <ul className="navbar__dropdown">
                  <li className="navbar__dropdown-user">
                    <strong>{user?.name || "Account"}</strong>
                    <span>{user?.email}</span>
                  </li>
                  <li>
                    <button type="button" onClick={() => { setDropdownOpen(false); navigate("/profile"); }}>
                      Profile
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => { setDropdownOpen(false); navigate("/history"); }}>
                      History
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={handleLogout}>
                      Log out
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            showLogin && (
              <Link to="/login" className="btn btn-primary btn-sm navbar__login">
                Log in
              </Link>
            )
          )}

          <button
            type="button"
            className="navbar__menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className="navbar__backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <nav className="navbar__drawer" aria-label="Mobile navigation">
            <div className="navbar__drawer-header">
              {loggedIn && (
                <div className="navbar__drawer-user">
                  <UserAvatar user={user} size={44} className="navbar__avatar--drawer" />
                  <div>
                    <strong>{user?.name || "Account"}</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>
              )}
            </div>
            <ul className="navbar__drawer-links">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`navbar__drawer-link ${isActive(l) ? "is-active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {loggedIn ? (
              <div className="navbar__drawer-footer">
                <button type="button" className="btn btn-outline btn-block" onClick={() => { setMobileOpen(false); navigate("/profile"); }}>
                  Profile
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            ) : (
              showLogin && (
                <div className="navbar__drawer-footer">
                  <Link to="/login" className="btn btn-primary btn-block" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                </div>
              )
            )}
          </nav>
        </>
      )}
    </header>
  );
}
