import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Menu,
  X,
  Send,
  Volume2,
  Copy,
  Bookmark,
  Check,
  Trash2,
} from "lucide-react";
import AppLayout from "./AppLayout";
import logoMark from "../assets/logo-mark.png";
import { CHAT_SUGGESTIONS } from "../data/mockData";
import {
  askAssistant,
  fetchConversations,
  fetchConversation,
  deleteConversation,
  fetchSavedResponses,
  saveAssistantResponse,
  deleteSavedResponse,
} from "../services/mockApi";
import { speakText } from "../utils/speech";
import "./AiAssistant.css";

const WELCOME =
  "Hi! I'm Omummu AI. Ask about grammar, pronunciation, translations, or African languages.";

function renderMarkdownLite(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function toUiMessage(msg) {
  return {
    id: msg.id,
    role: msg.role === "user" ? "user" : "ai",
    text: msg.content,
    phonetic: msg.phonetic,
  };
}

export default function AiAssistant() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([
    { id: "welcome", role: "ai", text: WELCOME },
  ]);
  const [conversations, setConversations] = useState([]);
  const [savedResponses, setSavedResponses] = useState([]);
  const [savedByMessageId, setSavedByMessageId] = useState({});
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const bottomRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data.conversations || []);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshSaved = useCallback(async () => {
    try {
      const data = await fetchSavedResponses();
      const saved = data.saved || [];
      setSavedResponses(saved);
      const map = {};
      saved.forEach((s) => {
        if (s.messageId) map[s.messageId] = s.id;
      });
      setSavedByMessageId(map);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingChats(true);
      await Promise.all([refreshConversations(), refreshSaved()]);
      setLoadingChats(false);
    })();
  }, [refreshConversations, refreshSaved]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const filteredHistory = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const startNewChat = () => {
    setMessages([{ id: "welcome", role: "ai", text: WELCOME }]);
    setActiveConversationId(null);
    setSidebarOpen(false);
  };

  const loadConversation = async (conversationId) => {
    if (conversationId === activeConversationId) {
      setSidebarOpen(false);
      return;
    }
    try {
      const data = await fetchConversation(conversationId);
      if (!data?.conversation) return;
      const uiMessages =
        data.messages?.length > 0
          ? data.messages.map(toUiMessage)
          : [{ id: "welcome", role: "ai", text: WELCOME }];
      setMessages(uiMessages);
      setActiveConversationId(conversationId);
      setSidebarOpen(false);
    } catch {
      /* ignore */
    }
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) startNewChat();
    } catch {
      /* ignore */
    }
  };

  const sendMessage = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || sending) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const reply = await askAssistant(text, activeConversationId);
      const convId = reply.conversationId;

      if (convId && convId !== activeConversationId) {
        setActiveConversationId(convId);
      }

      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === userMsg.id && reply.userMessageId
            ? { ...m, id: reply.userMessageId }
            : m
        ),
        {
          id: reply.messageId || `a-${Date.now()}`,
          role: "ai",
          text: reply.text,
          phonetic: reply.phonetic,
        },
      ]);

      await refreshConversations();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          text: "Sorry — I couldn't process that just now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\*\*/g, ""));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async (msg) => {
    const existingSavedId = savedByMessageId[msg.id];
    try {
      if (existingSavedId) {
        await deleteSavedResponse(existingSavedId);
        setSavedByMessageId((prev) => {
          const next = { ...prev };
          delete next[msg.id];
          return next;
        });
        setSavedResponses((prev) => prev.filter((s) => s.id !== existingSavedId));
        return;
      }
      const { saved } = await saveAssistantResponse({
        messageId: msg.id,
        conversationId: activeConversationId,
        content: msg.text,
      });
      setSavedByMessageId((prev) => ({ ...prev, [msg.id]: saved.id }));
      setSavedResponses((prev) => [saved, ...prev]);
    } catch {
      /* ignore */
    }
  };

  const handleRemoveSaved = async (savedId) => {
    try {
      await deleteSavedResponse(savedId);
      const entry = savedResponses.find((s) => s.id === savedId);
      setSavedResponses((prev) => prev.filter((s) => s.id !== savedId));
      if (entry?.messageId) {
        setSavedByMessageId((prev) => {
          const next = { ...prev };
          delete next[entry.messageId];
          return next;
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleListen = (text) => {
    speakText(text);
  };

  const showSuggestions =
    (!activeConversationId && messages.length <= 1) ||
    (activeConversationId && messages.length === 0);

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title || "New chat";

  return (
    <AppLayout showFooter={false}>
      <div className="assistant-page">
        {sidebarOpen && (
          <button
            type="button"
            className="assistant-backdrop"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`assistant-sidebar${sidebarOpen ? " is-open" : ""}`}>
          <div className="assistant-sidebar__top">
            <button type="button" className="new-chat-btn" onClick={startNewChat}>
              <Plus size={18} strokeWidth={2.25} />
              New chat
            </button>
            <button
              type="button"
              className="sidebar-close"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="assistant-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              aria-label="Search chats"
            />
          </div>

          <p className="chat-history-label">Recent</p>
          <ul className="chat-history-list">
            {loadingChats && <li className="chat-history-empty">Loading…</li>}
            {!loadingChats &&
              filteredHistory.map((chat) => (
                <li key={chat.id}>
                  <button
                    type="button"
                    className={`chat-history-item${
                      activeConversationId === chat.id ? " is-active" : ""
                    }`}
                    onClick={() => loadConversation(chat.id)}
                  >
                    <MessageSquare size={16} />
                    <span>{chat.title}</span>
                  </button>
                  <button
                    type="button"
                    className="chat-delete-btn"
                    aria-label={`Delete ${chat.title}`}
                    onClick={(e) => handleDeleteConversation(e, chat.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            {!loadingChats && filteredHistory.length === 0 && (
              <li className="chat-history-empty">No chats yet</li>
            )}
          </ul>

          {savedResponses.length > 0 && (
            <>
              <p className="chat-history-label">Saved</p>
              <ul className="saved-responses-list">
                {savedResponses.slice(0, 8).map((item) => (
                  <li key={item.id} className="saved-response-item">
                    <p>
                      {item.content.replace(/\*\*/g, "").slice(0, 72)}
                      {item.content.length > 72 ? "…" : ""}
                    </p>
                    <button
                      type="button"
                      className="saved-remove-btn"
                      aria-label="Remove saved response"
                      onClick={() => handleRemoveSaved(item.id)}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="assistant-sidebar__footer">
            <div className="assistant-brand-mark" aria-hidden="true">
              <img src={logoMark} alt="" />
            </div>
            <div>
              <div className="assistant-brand-title">Omummu AI</div>
              <div className="assistant-brand-sub">Linguist Assistant</div>
            </div>
          </div>
        </aside>

        <div className="assistant-main">
          <header className="assistant-header">
            <div className="assistant-header__left">
              <button
                type="button"
                className="mobile-menu-btn"
                aria-label="Open chat history"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div>
                <h1>AI Language Assistant</h1>
                <p>{activeTitle} · Grammar · Pronunciation · Culture</p>
              </div>
            </div>
          </header>

          <div className="assistant-scroll">
            <div className="chat-thread">
              {showSuggestions && (
                <div className="suggestion-chips">
                  {CHAT_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => sendMessage(suggestion)}
                      disabled={sending}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="msg msg--user">
                    <div className="msg-bubble msg-bubble--user">{msg.text}</div>
                    <div className="msg-avatar msg-avatar--user" aria-hidden="true">
                      L
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="msg msg--ai">
                    <div className="msg-avatar msg-avatar--ai" aria-hidden="true">
                      <img src={logoMark} alt="" />
                    </div>
                    <div className="msg-ai-stack">
                      <div className="msg-bubble msg-bubble--ai">
                        <p>{renderMarkdownLite(msg.text)}</p>
                        {msg.phonetic && (
                          <div className="phonetic-card">
                            <span className="phonetic-label">Phonetic</span>
                            <span className="phonetic-value">{msg.phonetic}</span>
                          </div>
                        )}
                      </div>
                      {msg.id !== "welcome" && (
                        <div className="msg-actions">
                          <button
                            type="button"
                            className="msg-action"
                            onClick={() => handleListen(msg.text)}
                            aria-label="Listen"
                          >
                            <Volume2 size={15} />
                            Listen
                          </button>
                          <button
                            type="button"
                            className="msg-action"
                            onClick={() => handleCopy(msg.id, msg.text)}
                            aria-label="Copy"
                          >
                            {copiedId === msg.id ? <Check size={15} /> : <Copy size={15} />}
                            {copiedId === msg.id ? "Copied" : "Copy"}
                          </button>
                          <button
                            type="button"
                            className={`msg-action${
                              savedByMessageId[msg.id] ? " is-saved" : ""
                            }`}
                            onClick={() => handleSave(msg)}
                            aria-label="Save"
                          >
                            <Bookmark size={15} />
                            {savedByMessageId[msg.id] ? "Saved" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {sending && (
                <div className="msg msg--ai">
                  <div className="msg-avatar msg-avatar--ai" aria-hidden="true">
                      <img src={logoMark} alt="" />
                    </div>
                  <div className="msg-bubble msg-bubble--ai typing" aria-label="Thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="assistant-composer">
            <form
              className="composer-bar"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about languages..."
                aria-label="Message Omummu AI"
                disabled={sending}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="composer-disclaimer">
              Omummu AI can make mistakes. Verify critical translations and cultural nuances.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
