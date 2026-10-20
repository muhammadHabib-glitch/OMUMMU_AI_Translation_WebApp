import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout({ children, showLogin = true, showFooter = true }) {
  return (
    <div className="app-shell">
      <Navbar showLogin={showLogin} />
      <main className="app-shell__main">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
