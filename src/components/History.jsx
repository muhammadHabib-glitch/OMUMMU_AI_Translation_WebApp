import React, { useState } from "react";
import "./History.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import logo from "../assets/logo.png";

const STATS = [
  { icon: "🕘", value: "127 Total", label: "TRANSLATIONS" },
  { icon: "⭐", value: "12 Favorites", label: "SAVED ITEMS" },
  { icon: "🌐", value: "8 Languages", label: "ACTIVE PAIRS" },
  { icon: "📈", value: "34 This week", label: "GROWTH RATE" },
];

const FILTERS = ["All", "Favorites", "English", "Igbo"];

const ROWS = [
  {
    id: 1,
    source: "Hello, how are you today?",
    translation: "Kedu, kedu ka i mere taa?",
    from: "EN",
    to: "IG",
    mode: "Voice",
    date: "Today 2:34 PM",
    favorite: true,
  },
  {
    id: 2,
    source: "Good morning",
    translation: "Ụtụtụ ọma",
    from: "EN",
    to: "IG",
    mode: "Text",
    date: "Today 11:15 AM",
    favorite: false,
  },
  {
    id: 3,
    source: "Where is the station?",
    translation: "Kedu ka ebe ọdụ oloko?",
    from: "EN",
    to: "IG",
    mode: "Camera",
    date: "Yesterday",
    favorite: false,
  },
  {
    id: 4,
    source: "Thank you",
    translation: "Daalụ",
    from: "EN",
    to: "IG",
    mode: "Text",
    date: "Yesterday",
    favorite: true,
  },
  {
    id: 5,
    source: "Welcome to Lagos",
    translation: "Barka da zuwa Legas",
    from: "EN",
    to: "HA",
    mode: "Text",
    date: "3 days ago",
    favorite: false,
  },
  {
    id: 6,
    source: "Good morning, family",
    translation: "Habari za asubuhi, familia",
    from: "EN",
    to: "SW",
    mode: "Voice",
    date: "Last week",
    favorite: false,
  },
];

const MODE_ICON = {
  Voice: "🎤",
  Text: "📄",
  Camera: "📷",
};

export default function History() {
  const [rows, setRows] = useState(ROWS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const toggleFavorite = (id) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, favorite: !row.favorite } : row)));

  const deleteRow = (id) => setRows((r) => r.filter((row) => row.id !== id));

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.source.toLowerCase().includes(search.toLowerCase()) ||
      row.translation.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Favorites" && row.favorite) ||
      (activeFilter === "English" && row.from === "EN") ||
      (activeFilter === "Igbo" && row.to === "IG");
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
    <Navbar/>
    <div className="history-page">
      <img src={logo} alt="Omummu" className="navbar-logo" />

      <div className="history-header">
        <div className="history-text">
          <h3>Translation History</h3>
          <p>Manage and review your past linguistic discoveries.</p>
        </div>
        <div className="history-header-actions">
          <button className="export-btn"> Export CSV</button>
          <button className="lang-dropdown-btn">All languages ⌄</button>
        </div>
      </div>

      <div className="history-toolbar">
        <div className="search-row">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search your history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${activeFilter === f ? "is-active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
            <button className="icon-circle" aria-label="voice search">
              🎤
            </button>
          </div>
        </div>
        <div className="mode-icons-row">
          <button className="icon-circle" aria-label="camera">
            📷
          </button>
          <button className="icon-circle" aria-label="document">
            📄
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>SOURCE TEXT</th>
              <th>TRANSLATION</th>
              <th>LANGUAGES</th>
              <th>MODE</th>
              <th>DATE</th>
              <th className="actions-head">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td className="source-cell">{row.source}</td>
                <td>{row.translation}</td>
                <td>
                  <span className="lang-pill">
                    {row.from} → {row.to}
                  </span>
                </td>
                <td className="mode-cell">
                  <span className="mode-icon">{MODE_ICON[row.mode]}</span>
                  {row.mode}
                </td>
                <td className="date-cell">{row.date}</td>
                <td className="actions-cell">
                  <button
                    className={`row-icon-btn ${row.favorite ? "is-fav" : ""}`}
                    onClick={() => toggleFavorite(row.id)}
                    aria-label="favorite"
                  >
                    {row.favorite ? "★" : "☆"}
                  </button>
                  <button className="row-icon-btn" aria-label="copy">
                    ⧉
                  </button>
                  <button
                    className="row-icon-btn delete"
                    onClick={() => deleteRow(row.id)}
                    aria-label="delete"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <span className="results-text">
            Showing <strong>1-{filteredRows.length}</strong> of 127 results
          </span>
          <div className="pagination">
            <button className="page-btn">‹</button>
            <button className="page-btn is-active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span className="page-dots">…</span>
            <button className="page-btn">22</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </div>
  );
}