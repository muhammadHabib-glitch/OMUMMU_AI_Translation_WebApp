import React, { useState } from "react";
import "./AiAssistant.css";
import avatar from "../assets/avatar.png";
import logo from "../assets/logo.png";
import Footer from "./Footer";
import Navbar from "./Navbar";

function AI_Assistent() {
    const [input, setInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const chats = [
        { name: "Igbo greetings", active: true },
        { name: "Grammar help", active: false },
        { name: "Yoruba phrases", active: false },
        { name: "Sentence correction", active: false },
    ];

    return (
        <div>

       <Navbar/>

        <div className="assistant-layout">
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`assistant-sidebar ${sidebarOpen ? "open" : ""}`}>
                <button className="new-chat-btn">
                    <span className="plus-icon">+</span> New chat
                </button>

                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search chats..." />
                </div>

                <ul className="chat-list">
                    {chats.map((chat, i) => (
                        <li key={i} className={chat.active ? "active" : ""}>
                            <span className="chat-icon">💬</span>
                            {chat.name}
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer">
                    <img src={logo} alt="Omummu AI" className="footer-logo" />
                    <div className="footer-text">
                        <div className="footer-title">Omummu AI</div>
                        <div className="footer-subtitle">Linguist Assistant</div>
                    </div>
                </div>
            </aside>

            <main className="assistant-main">
                <div className="scroll-area">
                    <header className="assistant-header">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span
                                className="mobile-menu-btn"
                                onClick={() => setSidebarOpen(true)}
                                style={{ display: "none", cursor: "pointer", fontSize: 20 }}
                            >
                                ☰
                            </span>
                            <div>
                                <h1>AI Language Assistant</h1>
                                <h2>GRAMMAR · PRONUNCIATION · CULTURE · AFRICAN LANGUAGES</h2>
                            </div>
                        </div>
                        <div className="header-icons">
                            <span>🔗</span>
                            <span>⋮</span>
                        </div>
                    </header>

                    <div className="chat-body">
                        <div className="quick-pills">
                            <button className="pill">Igbo greetings</button>
                            <button className="pill">Fix my grammar</button>
                            <button className="pill">Explain idioms</button>
                        </div>

                        <div className="message ai-message">
                            <div className="avatar-circle ai-avatar">O</div>
                            <div className="bubble ai-bubble">
                                Hi! I'm Omummu AI. Ask about grammar, pronunciation,
                                translations, or African languages.
                            </div>
                        </div>

                        <div className="message user-message">
                            <div className="bubble user-bubble">
                                How do I say Good morning in Igbo?
                            </div>
                            <img
                                src={avatar}
                                alt="User"
                                className="avatar-circle user-avatar"
                            />
                        </div>

                        <div className="message ai-message">
                            <div className="avatar-circle ai-avatar">O</div>
                            <div className="bubble ai-bubble">
                                <p>In Igbo, you can say:</p>
                                <div className="translation-card">
                                    <div className="translation-word">Ụtụtụ ọma</div>
                                    <div className="translation-meta">
                                        <span className="phonetic">/oo-TU-tu OH-ma/</span>
                                        <span className="tag">Informal &amp; Formal</span>
                                    </div>
                                </div>
                                <p className="translation-note">
                                    Used primarily in the morning hours until approximately
                                    11:00 AM.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="input-bar">
                    <input
                        type="text"
                        placeholder="Ask anything about languages..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <span className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </span>
                    <span className="icon-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                    </span>
                    <button className="send-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
                <p className="disclaimer">
                    Omummu AI can make mistakes. Verify critical translations and
                    cultural nuances.
                </p>
            </main>
        </div>
        <Footer/>
         </div>
    );
}

export default AI_Assistent;