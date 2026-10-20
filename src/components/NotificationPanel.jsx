import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/mockApi";
import "./NotificationPanel.css";

function formatRelativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString();
}

export default function NotificationPanel({ open, onClose, onUnreadChange }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNotifications({ limit: 20 });
      setNotifications(data.notifications || []);
      const unread = (data.notifications || []).filter((n) => !n.isRead).length;
      onUnreadChange?.(unread);
    } catch (err) {
      setError(err?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    if (!open) return;
    loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open, onClose]);

  async function handleItemClick(notification) {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        const nextUnread = notifications.filter((n) => n.id !== notification.id && !n.isRead).length;
        onUnreadChange?.(nextUnread);
      }
    } catch {
      /* navigate anyway */
    }
    onClose?.();
    if (notification.actionUrl) navigate(notification.actionUrl);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      );
      onUnreadChange?.(0);
    } catch (err) {
      setError(err?.message || "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  if (!open) return null;

  return (
    <div className="notification-panel" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="notification-panel__header">
        <h2>Notifications</h2>
        <button
          type="button"
          className="notification-panel__mark-all"
          onClick={handleMarkAll}
          disabled={markingAll || !notifications.some((n) => !n.isRead)}
        >
          Mark all as read
        </button>
      </div>

      <div className="notification-panel__body">
        {loading && (
          <ul className="notification-panel__list">
            {[1, 2, 3].map((i) => (
              <li key={i} className="notification-panel__item is-skeleton">
                <span className="notification-panel__skeleton-title" />
                <span className="notification-panel__skeleton-text" />
              </li>
            ))}
          </ul>
        )}

        {!loading && error && (
          <div className="notification-panel__empty">
            <p>{error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={loadNotifications}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="notification-panel__empty">
            <p>No notifications yet</p>
            <span>Learning milestones and announcements will appear here.</span>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ul className="notification-panel__list">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notification-panel__item${n.isRead ? "" : " is-unread"}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="notification-panel__item-top">
                    <strong>{n.title}</strong>
                    <time>{formatRelativeTime(n.createdAt)}</time>
                  </div>
                  <p>{n.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
