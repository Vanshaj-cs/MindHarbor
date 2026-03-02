import { useState, useRef, useEffect } from "react";
import { Bell, Menu, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/Authcontext";
import { moodService } from "../../services/moodService";

const emojiMap = {
  Angry: "😡",
  Disgust: "🤢",
  Fear: "😨",
  Happy: "😊",
  Neutral: "😐",
  Sad: "😔",
  Surprise: "😲",
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentMood, setRecentMood] = useState(null);
  const [loadingMood, setLoadingMood] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch recent mood from API
  useEffect(() => {
    const fetchRecentMood = async () => {
      try {
        const response = await moodService.getMoods();
        const moods = response.data.data || [];
        if (moods.length > 0) {
          setRecentMood(moods[0]); // Most recent mood
        }
      } catch (error) {
        console.error("Failed to fetch recent mood:", error);
      } finally {
        setLoadingMood(false);
      }
    };

    if (user) {
      fetchRecentMood();
    }
  }, [user]);

  // Listen for mood updates
  useEffect(() => {
    const handleMoodUpdate = (event) => {
      setRecentMood(event.detail);
    };

    window.addEventListener("moodUpdated", handleMoodUpdate);
    return () => window.removeEventListener("moodUpdated", handleMoodUpdate);
  }, []);

  const moodEmoji = recentMood ? emojiMap[recentMood.label] || "😐" : "😌";

  const moodText = recentMood ? recentMood.label : "No mood logged";

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-surface-hover transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>
          {user && (
            <div
              className="flex items-center gap-1.5"
              title="Your current mood"
            >
              <span className="text-lg">{moodEmoji}</span>
              <span className="text-xs text-text-muted hidden sm:inline capitalize">
                {moodText}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 rounded-xl hover:bg-surface-hover transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-text-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <Avatar
                  src={user.profilePicture}
                  name={user.fullName || user.username || user.email}
                  size="sm"
                />
                <span className="text-xs text-text-secondary hidden sm:block max-w-[100px] truncate">
                  {user.fullName || user.username}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-text-muted transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface-card rounded-2xl border border-forest-700/40 shadow-xl shadow-black/20 z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-forest-700/30">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
                    >
                      <User size={15} /> Profile
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
                    >
                      <Settings size={15} /> Settings
                    </button>
                    <div className="h-px bg-forest-700/30 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white text-sm font-medium transition-all duration-200"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
