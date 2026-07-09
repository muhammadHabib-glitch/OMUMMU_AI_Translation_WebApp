import "./Footer.css";
import logo from "../assets/logo.png";

const FOOTER_LINKS = ["Privacy Policy", "Terms of Service", "Help Center", "API Reference"];

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__row">
        <div className="app-footer__brand">
          <span className="app-footer__logo" aria-hidden="true">
            <img src={logo} alt="Omummu" className="navbar-logo" />
          </span>
          <span className="app-footer__name">Omummu</span>
        </div>

        <nav className="app-footer__links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a key={link} href="#" className="app-footer__link">
              {link}
            </a>
          ))}
        </nav>
      </div>

      <p className="app-footer__copyright">
        © 2024 Omummu · Empowering African Languages
      </p>
    </footer>
  );
}

