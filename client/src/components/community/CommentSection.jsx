import { useState, useEffect } from "react";
import {
  Heart,
  Reply,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { communityService } from "../../services/communityService";
import { useAuth } from "../../context/Authcontext";

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
};

// ── Single comment ────────────────────────────────────────────────────────────
const CommentItem = ({ comment, userId, allComments, onReply, onLike }) => {
  const [liked, setLiked] = useState(comment.likes?.includes(userId));
  const [likeCount, setLikeCount] = useState(comment.likes?.length || 0);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const replies = allComments.filter((c) => c.parentId === comment.id);

  const handleLike = async () => {
    try {
      const res = await communityService.likeComment(comment.id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await communityService.createComment(
        comment.postId,
        replyText.trim(),
        comment.id,
      );
      onReply?.(res.data);
      setReplyText("");
      setReplying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-lg bg-forest-800/60 border border-forest-700/30
          flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0"
        >
          {comment.anonName?.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-surface-card/40 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-emerald-300">
                {comment.anonName}
              </span>
              <span className="text-[10px] text-text-muted">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 pl-1">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-[11px] transition-colors duration-200
                ${liked ? "text-red-400" : "text-text-muted hover:text-red-400"}`}
            >
              <Heart size={11} fill={liked ? "currentColor" : "none"} />
              {likeCount > 0 && likeCount}
            </button>
            <button
              onClick={() => setReplying((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-text-muted hover:text-emerald-400
                transition-colors duration-200"
            >
              <Reply size={11} /> Reply
            </button>
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary
                  transition-colors duration-200"
              >
                {showReplies ? (
                  <ChevronUp size={11} />
                ) : (
                  <ChevronDown size={11} />
                )}
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply input */}
          {replying && (
            <form
              onSubmit={handleReply}
              className="flex items-center gap-2 mt-2"
            >
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.anonName}…`}
                className="flex-1 px-3 py-1.5 bg-surface-card rounded-xl text-xs text-text-primary
                  placeholder:text-text-muted border border-forest-700/40
                  focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30
                  transition-all duration-200"
              />
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="p-1.5 rounded-lg bg-forest-700 text-white disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
              </button>
            </form>
          )}

          {/* Nested replies */}
          {showReplies && replies.length > 0 && (
            <div className="ml-3 mt-2 space-y-2 border-l border-forest-700/20 pl-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  userId={userId}
                  allComments={allComments}
                  onReply={onReply}
                  onLike={onLike}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main CommentSection ───────────────────────────────────────────────────────
const CommentSection = ({ postId }) => {
  const { user } = useAuth();
  const userId = user?._id?.toString();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    communityService
      .getComments(postId)
      .then((res) => setComments(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await communityService.createComment(
        postId,
        input.trim(),
        null,
      );
      setComments((prev) => [...prev, res.data]);
      setInput("");
    } catch (err) {
      setError(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Only top-level comments (no parentId)
  const topLevel = comments.filter((c) => !c.parentId);

  return (
    <div className="border-t border-forest-700/20 pt-4 mt-4 space-y-4">
      {/* Input */}
      <form onSubmit={handleComment} className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg bg-forest-800/60 border border-forest-700/30
          flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0"
        >
          {user?.fullName?.charAt(0) || "?"}
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a comment anonymously…"
          className="flex-1 px-3.5 py-2 bg-surface-card rounded-xl text-sm text-text-primary
            placeholder:text-text-muted border border-forest-700/40
            focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30
            transition-all duration-200"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          className="p-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white
            disabled:opacity-50 transition-all duration-200"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="text-text-muted animate-spin" />
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-3">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={{ ...comment, postId }}
              userId={userId}
              allComments={comments}
              onReply={(newReply) => setComments((prev) => [...prev, newReply])}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
