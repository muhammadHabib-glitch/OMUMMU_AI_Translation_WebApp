import { Link } from "react-router-dom";
import Logo from "./Logo";
import "./Footer.css";

const LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact Us", href: "#" },
];

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__top">
          <Link to="/translate" className="app-footer__brand">
            <Logo size={28} />
          </Link>
          <nav className="app-footer__links" aria-label="Footer">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} className="app-footer__link">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="app-footer__copy">© 2024 Omummu · Empowering African Languages</p>
      </div>
    </footer>
  );
}
