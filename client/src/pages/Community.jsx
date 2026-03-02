import { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe,
  Building2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/Authcontext";
import { communityService } from "../services/communityService.js";
import CreatePost from "../components/community/CreatePost";
import PostCard from "../components/community/PostCard";

// ── Moderation warning banner ─────────────────────────────────────────────────
const ModerationBanner = ({ data, onDismiss }) => {
  if (!data) return null;
  const { isBlocked, strikes, blockedUntil, message } = data;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border animate-fade-in
      ${
        isBlocked
          ? "bg-red-500/10 border-red-500/25"
          : "bg-yellow-500/10 border-yellow-500/25"
      }`}
    >
      <AlertTriangle
        size={16}
        className={isBlocked ? "text-red-400" : "text-yellow-400"}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${isBlocked ? "text-red-300" : "text-yellow-300"}`}
        >
          {isBlocked
            ? "Account temporarily blocked"
            : `Community guideline warning — Strike ${strikes}/3`}
        </p>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          {message}
        </p>
        {isBlocked && blockedUntil && (
          <p className="text-xs text-red-400 mt-1">
            Blocked until: {new Date(blockedUntil).toLocaleString("en-IN")}
          </p>
        )}
        {!isBlocked && (
          <p className="text-xs text-text-muted mt-1">
            {3 - strikes} more violation{3 - strikes !== 1 ? "s" : ""} will
            result in a 72-hour block.
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary text-xs"
      >
        ✕
      </button>
    </div>
  );
};

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ mode }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div
      className="w-14 h-14 rounded-2xl bg-forest-800/50 border border-forest-700/30
      flex items-center justify-center mb-4"
    >
      {mode === "global" ? (
        <Globe size={22} className="text-text-muted" />
      ) : (
        <Building2 size={22} className="text-text-muted" />
      )}
    </div>
    <h3 className="text-base font-semibold text-text-primary mb-1">
      No posts yet
    </h3>
    <p className="text-sm text-text-muted max-w-xs">
      {mode === "global"
        ? "Be the first to share something in the global community."
        : "No posts from your institution yet. Start the conversation!"}
    </p>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const Community = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState("global"); // 'global' | 'institute'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [modWarning, setModWarning] = useState(null);
  const [modStatus, setModStatus] = useState(null);
  const loaderRef = useRef(null);

  const institute = user?.institution?.name || "";
  const hasInstitute = !!institute;

  // ── Load posts ──────────────────────────────────────────────────────────────
  const loadPosts = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setCursor(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await communityService.getPosts(
          mode,
          reset ? null : cursor,
        );
        const { posts: newPosts, nextCursor } = res.data;

        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        setCursor(nextCursor);
        setHasMore(!!nextCursor);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mode, cursor],
  );

  // Reset on mode change
  useEffect(() => {
    loadPosts(true);
  }, [mode]); // eslint-disable-line

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadPosts]);

  // ── Check moderation status ─────────────────────────────────────────────────
  useEffect(() => {
    communityService
      .getModerationStatus()
      .then((res) => setModStatus(res.data))
      .catch(() => {});
  }, []);

  // ── Handle new post ─────────────────────────────────────────────────────────
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="gradient-hero px-5 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
        <div className="max-w-5xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="section-label text-emerald-400">
                  Safe Space
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                Community
              </h1>
              <p className="text-base text-text-secondary mt-2 max-w-lg leading-relaxed">
                Share your thoughts, feelings, and experiences anonymously. You
                are not alone.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Shield size={12} className="text-emerald-400" />
                  <span>Always anonymous</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users size={12} className="text-emerald-400" />
                  <span>Safe & moderated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* ── Blocked user banner ──────────────────────────────────────────── */}
        {modStatus?.isBlocked && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">
                Account blocked
              </p>
              <p className="text-xs text-text-muted mt-1">
                You cannot post or comment until{" "}
                {modStatus.blockedUntil
                  ? new Date(modStatus.blockedUntil).toLocaleString("en-IN")
                  : "further notice"}
                .
              </p>
            </div>
          </div>
        )}

        {/* ── Moderation warning (after a strike) ─────────────────────────── */}
        <ModerationBanner
          data={modWarning}
          onDismiss={() => setModWarning(null)}
        />

        {/* ── Mode toggle ─────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-surface-card/50 rounded-2xl w-fit">
          <button
            onClick={() => setMode("global")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${
                mode === "global"
                  ? "bg-forest-700 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
          >
            <Globe size={14} /> Global
          </button>
          <button
            onClick={() => {
              setMode("institute");
            }}
            disabled={!hasInstitute}
            title={
              !hasInstitute
                ? "Add your institution in Profile to enable this"
                : ""
            }
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${
                mode === "institute"
                  ? "bg-forest-700 text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }
              ${!hasInstitute ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <Building2 size={14} />
            {hasInstitute ? institute.split(" ")[0] : "Institute"}
          </button>
        </div>

        {!hasInstitute && mode === "global" && (
          <p className="text-xs text-text-muted px-1">
            💡 Add your institution in{" "}
            <a href="/profile" className="text-emerald-400 hover:underline">
              Profile
            </a>{" "}
            to see posts from your college.
          </p>
        )}

        {/* ── Create post ──────────────────────────────────────────────────── */}
        {!modStatus?.isBlocked && (
          <CreatePost
            mode={mode}
            onCreated={handlePostCreated}
            onModerationWarning={(data) => setModWarning(data)}
          />
        )}

        {/* ── Feed ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={22} className="text-text-muted animate-spin" />
            <p className="text-xs text-text-muted">Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="flex justify-center py-4">
              {loadingMore && (
                <Loader2 size={18} className="text-text-muted animate-spin" />
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-xs text-text-muted">
                  You've reached the end 🌿
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Refresh button ────────────────────────────────────────────────── */}
        {!loading && posts.length > 0 && (
          <div className="flex justify-center pb-4">
            <button
              onClick={() => loadPosts(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-text-muted
                hover:text-text-primary hover:bg-surface-hover transition-all duration-200"
            >
              <RefreshCw size={13} /> Refresh feed
            </button>
          </div>
        )}

        {/* ── Community guidelines ──────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-surface-card/30 border border-forest-700/20">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={13} className="text-emerald-400" />
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Community Guidelines
            </p>
          </div>
          <ul className="space-y-1 text-xs text-text-muted">
            {[
              "Be kind and respectful to everyone",
              "This is a safe, anonymous space — keep it that way",
              "No hate speech, slurs, or violent content",
              "Vulgar language triggers an automatic warning",
              "3 violations = 72-hour posting block",
              "In crisis? Reach out to iCall: 9152987821",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span> {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Community;
