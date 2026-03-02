import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Plus,
  Trash2,
  MessageCircleHeart,
  ChevronLeft,
  AlertCircle,
  Loader2,
  History,
  Smile,
} from "lucide-react";
import ChatBubble from "../components/chat/ChatBubble";
import SuggestedPrompts from "../components/chat/SuggestedPrompts";
import TypingIndicator from "../components/chat/TypingIndicator";
import CrisisAlert from "../components/chat/CrisisAlert";
import { useAuth } from "../context/Authcontext";
import { chatService } from "../services/chatService";

const crisisKeywords = [
  "suicide",
  "kill myself",
  "end it all",
  "self-harm",
  "don't want to live",
];

// ── Mood emoji map ────────────────────────────────────────────────────────────
const moodEmoji = (label) =>
  ({
    very_happy: "😊",
    happy: "😊",
    calm: "😌",
    neutral: "😐",
    sad: "😔",
    very_sad: "😢",
    anxious: "😟",
    stressed: "😤",
  })[label] ?? "💬";

// ── Convert DB message shape → display shape ──────────────────────────────────
const toDisplay = (msg) => ({
  id: msg._id || `${msg.role}-${Date.now()}-${Math.random()}`,
  message: msg.content,
  isUser: msg.role === "user",
  timestamp: msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "",
});

// ── Sidebar session item ──────────────────────────────────────────────────────
const SessionItem = ({ session, isActive, onClick, onDelete }) => {
  const emoji = moodEmoji(session.moodContext?.label);
  const date = new Date(session.lastActivity || session.createdAt);
  const dateStr = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer
        transition-all duration-200 select-none
        ${
          isActive
            ? "bg-forest-800/50 text-text-primary"
            : "hover:bg-surface-hover/50 text-text-muted hover:text-text-primary"
        }`}
    >
      <span className="text-base mt-0.5 shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {session.title || "Chat session"}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {session.messageCount || 0} msgs · {dateStr}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.sessionId);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20
          transition-all duration-200 shrink-0 mt-0.5"
        title="Delete session"
      >
        <Trash2 size={12} className="text-red-400" />
      </button>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AIChat = () => {
  const { user } = useAuth();

  // Session
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  // UI
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState("");
  const [initialised, setInitialised] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const firstName = user?.fullName?.split(" ")[0] || user?.username || "there";

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ── Load all sessions ───────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const res = await chatService.getSessions();
      setSessions(res.data || []);
      return res.data || [];
    } catch (err) {
      console.error("Failed to load sessions:", err.message);
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // ── Load messages for one session ───────────────────────────────────────────
  const loadSession = useCallback(async (sessionId) => {
    setLoadingSession(true);
    setError("");
    try {
      const res = await chatService.getSession(sessionId);
      const session = res.data;
      setActiveSessionId(sessionId);
      setMessages(session.messages.map(toDisplay));
      setShowPrompts(session.messages.length === 0);
    } catch (err) {
      setError("Failed to load chat. Please try again.");
    } finally {
      setLoadingSession(false);
    }
  }, []);

  // ── Start a new session ─────────────────────────────────────────────────────
  const startNewSession = useCallback(async () => {
    setError("");
    setMessages([]);
    setActiveSessionId(null);
    try {
      const res = await chatService.startSession();
      const sessionId = res.data.sessionId;
      setActiveSessionId(sessionId);
      setShowPrompts(true);

      // Show welcome message locally (not in DB yet)
      setMessages([
        {
          id: "welcome",
          message: `Hi ${firstName}! 👋 I'm your Mind Harbor companion. I'm here to listen, support, and chat whenever you need. How are you feeling today?`,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);

      // Refresh sidebar
      const updated = await loadSessions();
      setSessions(updated);
    } catch (err) {
      setError("Could not start a new session. Please try again.");
    }
  }, [firstName, loadSessions]);

  // ── Initial load: fetch sessions, open latest or start fresh ───────────────
  useEffect(() => {
    if (initialised) return;
    setInitialised(true);

    (async () => {
      const list = await loadSessions();
      if (list.length === 0) {
        await startNewSession();
      } else {
        const latest = list.find((s) => s.isActive) || list[0];
        await loadSession(latest.sessionId);
      }
    })();
  }, []); // eslint-disable-line

  // ── Delete a session ────────────────────────────────────────────────────────
  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await chatService.deleteSession(sessionId);
        const remaining = sessions.filter((s) => s.sessionId !== sessionId);
        setSessions(remaining);

        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            await loadSession(remaining[0].sessionId);
          } else {
            await startNewSession();
          }
        }
      } catch {
        setError("Failed to delete session.");
      }
    },
    [activeSessionId, sessions, loadSession, startNewSession],
  );

  // ── Send a message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !activeSessionId || isTyping) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        message: text.trim(),
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setShowPrompts(false);
      setError("");

      // Crisis detection
      if (crisisKeywords.some((kw) => text.toLowerCase().includes(kw))) {
        setShowCrisis(true);
      }

      setIsTyping(true);
      try {
        const res = await chatService.sendMessage(activeSessionId, text.trim());
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            message: res.data.aiReply,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        // Refresh sidebar so title + count update
        loadSessions();
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            message:
              "I'm having trouble responding right now. Please try again in a moment. 🙏",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setError(err.message);
      } finally {
        setIsTyping(false);
        inputRef.current?.focus();
      }
    },
    [activeSessionId, isTyping, loadSessions],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Session history sidebar ──────────────────────────────────────── */}
      <aside
        className={`shrink-0 flex flex-col
          bg-surface-card/60 backdrop-blur-sm border-r border-forest-700/30
          transition-all duration-300 overflow-hidden
          ${sidebarOpen ? "w-60" : "w-0"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-forest-700/20 shrink-0">
          <div className="flex items-center gap-2">
            <History size={14} className="text-text-muted" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Chats
            </span>
          </div>
          <button
            onClick={startNewSession}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            title="New chat"
          >
            <Plus size={14} className="text-emerald-400" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="text-text-muted animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6 px-3">
              No chats yet
            </p>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                session={session}
                isActive={activeSessionId === session.sessionId}
                onClick={() => {
                  if (activeSessionId !== session.sessionId) {
                    loadSession(session.sessionId);
                  }
                }}
                onDelete={deleteSession}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 lg:px-6 py-3.5 border-b border-forest-700/20 shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
            title={sidebarOpen ? "Hide history" : "Show history"}
          >
            <ChevronLeft
              size={18}
              className={`text-text-muted transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`}
            />
          </button>

          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <MessageCircleHeart size={18} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">
              Mind Harbor AI Companion
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-soft" />
              <span className="text-xs text-text-muted">
                Always here for you
              </span>
            </div>
          </div>

          <button
            onClick={startNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
              bg-forest-700/50 hover:bg-forest-700 text-emerald-300
              text-xs font-medium transition-all duration-200"
          >
            <Plus size={13} />
            New chat
          </button>
        </div>

        {/* Crisis alert */}
        {showCrisis && (
          <div className="px-5 lg:px-6 pt-3 shrink-0">
            <CrisisAlert onDismiss={() => setShowCrisis(false)} />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div
            className="mx-5 lg:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20
            flex items-center gap-2 shrink-0"
          >
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-300 flex-1">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 lg:px-6 py-4"
        >
          {loadingSession ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={20} className="text-text-muted animate-spin" />
                <p className="text-xs text-text-muted">Loading chat…</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg.message}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Suggested prompts — only on empty sessions */}
        {showPrompts && messages.length <= 1 && !loadingSession && (
          <div className="px-5 lg:px-6 shrink-0">
            <div className="max-w-3xl mx-auto">
              <SuggestedPrompts onSelect={sendMessage} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-5 lg:px-6 pt-3 pb-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2.5 rounded-xl hover:bg-surface-hover transition-colors shrink-0"
                >
                  <Smile size={20} className="text-text-muted" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  disabled={!activeSessionId || loadingSession}
                  className="flex-1 px-4 py-2.5 bg-surface-card rounded-xl
                    text-sm text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-forest-600
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    isTyping ||
                    !activeSessionId ||
                    loadingSession
                  }
                  className="p-2.5 rounded-xl gradient-primary text-white
                    hover:opacity-90 transition-opacity duration-200
                    disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isTyping ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </form>
            <p className="text-[10px] text-text-muted text-center mt-2">
              Mind Harbor AI is here to support, not replace professional help.
              If you're in crisis, please reach out to a counselor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
