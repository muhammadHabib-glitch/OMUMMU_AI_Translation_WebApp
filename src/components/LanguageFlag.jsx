import { Globe } from "lucide-react";
import { getFlagCode } from "../utils/flagUtils";

/**
 * Renders a professional flag from ISO countryCode (works on Windows, Mac, mobile browsers).
 * Uses flag-icons SVG sprites — not emoji.
 */
export default function LanguageFlag({
  countryCode,
  detectOnly = false,
  size = "md",
  className = "",
}) {
  const code = detectOnly ? null : getFlagCode(countryCode);

  if (!code) {
    const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
    return (
      <span className={`lang-flag-globe-wrap ${className}`} aria-hidden="true">
        <Globe size={iconSize} strokeWidth={2} />
      </span>
    );
  }

  return (
    <span
      className={`lang-flag fi fi-${code} lang-flag--${size} ${className}`}
      role="img"
      aria-hidden="true"
      title={code.toUpperCase()}
    />
  );
}
