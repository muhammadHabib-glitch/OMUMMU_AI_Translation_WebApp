import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flame,
  Languages,
  Heart,
  FileText,
  ChevronRight,
  User,
  Bell,
  Globe,
  Shield,
  HelpCircle,
  MessageSquare,
  LogOut,
  Crown,
  Settings,
  LayoutDashboard,
  X,
  Camera,
} from "lucide-react";
import AppLayout from "./AppLayout";
import { clearSession, getToken, setSession } from "../services/apiClient";
import {
  fetchProfile,
  updateProfileName,
  uploadProfileAvatar,
  removeProfileAvatar,
  resolveAssetUrl,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  fetchBillingConfig,
  fetchBillingPlans,
} from "../services/mockApi";
import SubscriptionSection from "./SubscriptionSection";
import UpgradeModal from "./UpgradeModal";
import { isPremiumUser } from "../utils/entitlements";
import "./Profile.css";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatPlan(plan) {
  const p = String(plan || "Free").trim();
  if (/plan$/i.test(p)) return p;
  return `${p} Plan`;
}

const SETTINGS = [
  {
    title: "Account",
    items: [
      { id: "edit", label: "Edit profile", icon: User, action: "edit" },
      { id: "notifications", label: "Notifications", icon: Bell, action: "notifications" },
      { id: "admin", label: "Admin console", icon: LayoutDashboard, to: "/admin", adminOnly: true },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "language", label: "Language & region", icon: Globe, placeholder: true },
      { id: "privacy", label: "Privacy & security", icon: Shield, placeholder: true },
      { id: "settings", label: "App settings", icon: Settings, placeholder: true },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help center", icon: HelpCircle, placeholder: true },
      {
        id: "feedback",
        label: "Send feedback",
        icon: MessageSquare,
        href: "mailto:omummuaitranslation@gmail.com?subject=Omummu%20Feedback",
      },
    ],
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingPlans, setBillingPlans] = useState([]);
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);

  const loadProfile = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await fetchProfile();
      setProfile(data);
      setEditName(data?.user?.name || "");
    } catch (err) {
      setError(err?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBillingConfig(), fetchBillingPlans()])
      .then(([config, plansData]) => {
        if (cancelled) return;
        setCheckoutAvailable(Boolean(config.checkoutAvailable));
        setBillingPlans(plansData.plans || []);
      })
      .catch(() => {
        if (!cancelled) setCheckoutAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { user } = await updateProfileName(editName.trim());
      const token = getToken();
      if (token && user) setSession({ token, user });
      await loadProfile();
      setEditOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setError("Use JPG, PNG, or WEBP for profile photos (max 2 MB).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile image must be 2 MB or smaller.");
      return;
    }
    setAvatarBusy(true);
    setError("");
    try {
      const { user } = await uploadProfileAvatar(file);
      const token = getToken();
      if (token && user) setSession({ token, user });
      await loadProfile();
      setEditOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to upload profile image.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    setError("");
    try {
      const { user } = await removeProfileAvatar();
      const token = getToken();
      if (token && user) setSession({ token, user });
      await loadProfile();
    } catch (err) {
      setError(err?.message || "Unable to remove profile image.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function openNotificationsModal() {
    setError("");
    setNotifOpen(true);
    try {
      const data = await fetchNotificationPreferences();
      setNotifPrefs(data.preferences || data);
    } catch (err) {
      setError(err?.message || "Unable to load notification preferences.");
      setNotifOpen(false);
    }
  }

  async function handleSaveNotificationPrefs(e) {
    e.preventDefault();
    if (!notifPrefs) return;
    setNotifSaving(true);
    setError("");
    try {
      const data = await updateNotificationPreferences({
        inAppEnabled: notifPrefs.inAppEnabled,
        emailEnabled: notifPrefs.emailEnabled,
        pushEnabled: notifPrefs.pushEnabled,
        learningEnabled: notifPrefs.learningEnabled,
        communityEnabled: notifPrefs.communityEnabled,
        subscriptionEnabled: notifPrefs.subscriptionEnabled,
        systemEnabled: notifPrefs.systemEnabled,
      });
      setNotifPrefs(data.preferences || data);
      setNotifOpen(false);
    } catch (err) {
      setError(err?.message || "Unable to save notification preferences.");
    } finally {
      setNotifSaving(false);
    }
  }

  function toggleNotifPref(key) {
    setNotifPrefs((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  }

  const user = profile?.user;
  const stats = profile?.stats;
  const streak = profile?.streak;
  const avatarSrc = resolveAssetUrl(user?.avatarUrl);
  const initials = initialsFromName(user?.name);
  const isAdmin = user?.role === "admin";
  const isPremium = isPremiumUser(user);

  return (
    <AppLayout>
      <div className="profile-page page-container">
        <header className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account, progress, and preferences</p>
        </header>

        {error && <p className="profile-error">{error}</p>}

        {loading ? (
          <p className="profile-loading">Loading profile…</p>
        ) : user ? (
          <>
            <section className="profile-card">
              <div className="profile-card__avatar" aria-hidden="true">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="" className="profile-card__avatar-img" />
                ) : (
                  initials
                )}
              </div>
              <div className="profile-card__info">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span className="profile-plan-badge">{formatPlan(user.plan)}</span>
              </div>
            </section>

            <section className="profile-stats" aria-label="Activity stats">
              <div className="profile-stat">
                <div className="profile-stat__icon">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="profile-stat__value">{stats?.translations ?? 0}</div>
                  <div className="profile-stat__label">Translations</div>
                </div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat__icon">
                  <Languages size={18} />
                </div>
                <div>
                  <div className="profile-stat__value">{stats?.languages ?? 0}</div>
                  <div className="profile-stat__label">Languages</div>
                </div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat__icon">
                  <Heart size={18} />
                </div>
                <div>
                  <div className="profile-stat__value">{stats?.favorites ?? 0}</div>
                  <div className="profile-stat__label">Favorites</div>
                </div>
              </div>
            </section>

            <section className="profile-streak">
              <div className="profile-streak__top">
                <div className="profile-streak__title">
                  <Flame size={20} className="profile-streak__flame" />
                  <div>
                    <h3>Learning streak</h3>
                    <p>{streak?.message || "Start learning today to begin your streak."}</p>
                  </div>
                </div>
                <span className="profile-streak__count">{streak?.current ?? 0}</span>
              </div>
              <div className="profile-streak__days">
                {(streak?.weekDays || []).map((d, i) => (
                  <div key={`${d.day}-${i}`} className="profile-streak__day">
                    <span className={`profile-streak__dot${d.done ? " is-done" : ""}`} />
                    <span className="profile-streak__label">{d.day}</span>
                  </div>
                ))}
              </div>
            </section>

            {!isPremium && (
              <section className="profile-upsell">
                <div className="profile-upsell__content">
                  <div className="profile-upsell__badge">
                    <Crown size={16} />
                    Premium
                  </div>
                  <h3>Go Omummu Premium</h3>
                  <p>
                    Unlock offline packs, priority AI, document batch translation, and
                    ad-free learning.
                  </p>
                </div>
                <button
                  type="button"
                  className="profile-upsell__cta"
                  onClick={() => setUpgradeOpen(true)}
                >
                  Upgrade Now
                </button>
              </section>
            )}

            <SubscriptionSection
              checkoutAvailable={checkoutAvailable}
              onUpgrade={() => setUpgradeOpen(true)}
            />

            <div className="profile-settings">
              {SETTINGS.map((section) => {
                const items = section.items.filter((item) => !item.adminOnly || isAdmin);
                if (!items.length) return null;
                return (
                  <section key={section.title} className="profile-settings__section">
                    <h3 className="profile-settings__heading">{section.title}</h3>
                    <ul className="profile-settings__list">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const content = (
                          <>
                            <span className="profile-settings__icon">
                              <Icon size={18} />
                            </span>
                            <span className="profile-settings__label">{item.label}</span>
                            {item.placeholder && (
                              <span className="profile-settings__soon">Coming soon</span>
                            )}
                            <ChevronRight size={16} className="profile-settings__chevron" />
                          </>
                        );
                        return (
                          <li key={item.id}>
                            {item.to ? (
                              <Link to={item.to} className="profile-settings__row">
                                {content}
                              </Link>
                            ) : item.href ? (
                              <a href={item.href} className="profile-settings__row">
                                {content}
                              </a>
                            ) : item.action === "edit" ? (
                              <button
                                type="button"
                                className="profile-settings__row"
                                onClick={() => {
                                  setEditName(user.name || "");
                                  setEditOpen(true);
                                }}
                              >
                                {content}
                              </button>
                            ) : item.action === "notifications" ? (
                              <button
                                type="button"
                                className="profile-settings__row"
                                onClick={openNotificationsModal}
                              >
                                {content}
                              </button>
                            ) : (
                              <span
                                className="profile-settings__row is-disabled"
                                title="Coming soon"
                              >
                                {content}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <p className="profile-loading">Profile unavailable.</p>
        )}

        <button type="button" className="profile-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Log out
        </button>

        {editOpen && user && (
          <div className="profile-modal-backdrop" role="presentation" onClick={() => setEditOpen(false)}>
            <div
              className="profile-modal"
              role="dialog"
              aria-labelledby="edit-profile-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal__header">
                <h2 id="edit-profile-title">Edit profile</h2>
                <button type="button" className="profile-modal__close" onClick={() => setEditOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="profile-modal__avatar-row">
                <div className="profile-card__avatar profile-card__avatar--modal">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="profile-card__avatar-img" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="profile-modal__avatar-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={avatarBusy}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={16} /> {avatarBusy ? "Uploading…" : "Change photo"}
                  </button>
                  {user.avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={avatarBusy}
                      onClick={handleRemoveAvatar}
                    >
                      Remove photo
                    </button>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    hidden
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleAvatarSelect}
                  />
                </div>
              </div>
              <form onSubmit={handleSaveProfile}>
                <label className="profile-modal__label">
                  Full name
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    minLength={2}
                    required
                  />
                </label>
                <label className="profile-modal__label">
                  Email
                  <input type="email" value={user.email} disabled />
                </label>
                <div className="profile-modal__actions">
                  <button type="button" className="btn btn-outline" onClick={() => setEditOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {notifOpen && notifPrefs && (
          <div className="profile-modal-backdrop" role="presentation" onClick={() => setNotifOpen(false)}>
            <div
              className="profile-modal profile-modal--wide"
              role="dialog"
              aria-labelledby="notif-prefs-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-modal__header">
                <h2 id="notif-prefs-title">Notification preferences</h2>
                <button
                  type="button"
                  className="profile-modal__close"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveNotificationPrefs} className="profile-notif-form">
                {[
                  { key: "inAppEnabled", label: "In-app notifications", hint: "Show alerts in the notification bell." },
                  {
                    key: "emailEnabled",
                    label: "Email notifications (requires server mail configuration)",
                    hint: notifPrefs.emailDeliveryAvailable
                      ? "Send copies of important notifications to your email."
                      : "Email delivery is not configured on this server.",
                    disabled: !notifPrefs.emailDeliveryAvailable,
                  },
                  { key: "learningEnabled", label: "Learning", hint: "Badges, lessons, challenges, and speaking practice." },
                  { key: "communityEnabled", label: "Community", hint: "Replies and interactions (when available)." },
                  { key: "subscriptionEnabled", label: "Subscription", hint: "Billing and plan updates (when available)." },
                  { key: "systemEnabled", label: "System announcements", hint: "Platform news from Omummu admins." },
                ].map((item) => (
                  <label key={item.key} className={`profile-notif-toggle${item.disabled ? " is-disabled" : ""}`}>
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.hint}</em>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(notifPrefs[item.key])}
                      disabled={item.disabled}
                      onChange={() => toggleNotifPref(item.key)}
                    />
                  </label>
                ))}
                <div className="profile-modal__actions">
                  <button type="button" className="btn btn-outline" onClick={() => setNotifOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={notifSaving}>
                    {notifSaving ? "Saving…" : "Save preferences"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          plans={billingPlans}
          checkoutAvailable={checkoutAvailable}
        />
      </div>
    </AppLayout>
  );
}
