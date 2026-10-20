import { useState } from "react";
import { resolveAssetUrl } from "../services/mockApi";
import "./UserAvatar.css";

export function initialsFromUser(user) {
  const name = user?.name || "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (user?.email || "U").slice(0, 2).toUpperCase();
}

export default function UserAvatar({ user, size = 36, className = "" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatarUrl = resolveAssetUrl(user?.avatarUrl);
  const initials = initialsFromUser(user);
  const classes = ["user-avatar", className].filter(Boolean).join(" ");

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name ? `${user.name}'s profile photo` : "Profile photo"}
        className={`${classes} user-avatar--img`}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className={`${classes} user-avatar--initials`}
      style={{ width: size, height: size, fontSize: size > 40 ? 14 : 12 }}
      aria-hidden={Boolean(user?.name)}
    >
      {initials}
    </span>
  );
}
