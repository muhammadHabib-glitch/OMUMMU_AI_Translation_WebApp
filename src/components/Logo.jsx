import logoSrc from "../assets/logo-mark.png";

export default function Logo({ size = 36, showWordmark = true, wordmarkClass = "" }) {
  return (
    <span className="omummu-logo" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <img
        src={logoSrc}
        alt="Omummu"
        width={size}
        height={size}
        className="omummu-logo__mark"
        style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      />
      {showWordmark && (
        <span
          className={wordmarkClass}
          style={{
            fontWeight: 700,
            fontSize: size > 32 ? 22 : 18,
            color: "var(--primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Omummu
        </span>
      )}
    </span>
  );
}
