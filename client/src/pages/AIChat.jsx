import { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import ChatBubble from "../components/chat/ChatBubble";
import SuggestedPrompts from "../components/chat/SuggestedPrompts";
import TypingIndicator from "../components/chat/TypingIndicator";
import CrisisAlert from "../components/chat/CrisisAlert";
import { useAuth } from "../context/Authcontext";
const initialMessages = [
  {
    id: 1,
    message: `Hi there! 👋 I'm your Mind Harbor companion. I'm here to listen, support, and chat whenever you need. How are you feeling today?`,
    isUser: false,
    timestamp: "10:00 AM",
  },
];

const aiResponses = [
  "Thank you for sharing that with me. It takes courage to express how you feel. Can you tell me more about what's been on your mind?",
  "I hear you, and what you're feeling is completely valid. Many students experience similar emotions. Would you like to try a quick breathing exercise together?",
  "That sounds challenging, and I appreciate you opening up. Remember, it's okay to not be okay sometimes. What usually helps you feel a bit better?",
  "I'm glad you're talking about this. Self-awareness is a strength! Let me suggest some resources that might help you with what you're going through.",
];

const crisisKeywords = [
  "suicide",
  "kill myself",
  "end it all",
  "self-harm",
  "don't want to live",
];

const AIChat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      message: text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowPrompts(false);

    // Check for crisis keywords
    const isCrisis = crisisKeywords.some((kw) =>
      text.toLowerCase().includes(kw),
    );
    if (isCrisis) {
      setShowCrisis(true);
    }

    // Simulate AI response
    setIsTyping(true);
    setTimeout(
      () => {
        const response =
          aiResponses[Math.floor(Math.random() * aiResponses.length)];
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            message: response,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setIsTyping(false);
      },
      1500 + Math.random() * 1000,
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || user?.username || "there";
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 lg:px-8 py-4">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
          <span className="text-white text-base">🤖</span>
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Mind Harbor AI Companion
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-soft" />
            <span className="text-xs text-text-muted">Always here for you</span>
          </div>
        </div>
      </div>

      {/* Crisis alert */}
      {showCrisis && (
        <div className="px-5 lg:px-8">
          <CrisisAlert onDismiss={() => setShowCrisis(false)} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 lg:px-8 py-4 space-y-4"
      >
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
      </div>

      {/* Suggested prompts */}
      {showPrompts && messages.length <= 1 && (
        <div className="px-5 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SuggestedPrompts onSelect={(prompt) => sendMessage(prompt)} />
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-5 lg:px-8 pt-3 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-surface-hover transition-colors"
            >
              <Smile size={20} className="text-text-muted" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="
              flex-1 px-4 py-2.5
              bg-surface-card rounded-xl
              text-sm text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-forest-600
              transition-all duration-200
            "
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="
              p-2.5 rounded-xl gradient-primary text-white
              hover:opacity-90 transition-opacity duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-text-muted text-center mt-2">
            Mind Harbor AI is here to support, not replace professional help. If
            you're in crisis, please reach out to a counselor.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AIChat;
