import { useState } from "react";
import {
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
} from "lucide-react";
import { communityService } from "../../services/communityService";
import { useAuth } from "../../context/Authcontext";
import CommentSection from "./CommentSection";

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

const PostCard = ({ post }) => {
  const { user } = useAuth();
  const userId = user?._id?.toString();
  const [liked, setLiked] = useState(post.likes?.includes(userId));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [mediaIndex, setMediaIndex] = useState(0);

  const handleLike = async () => {
    try {
      const res = await communityService.likePost(post.id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {}
  };

  return (
    <article
      className="bg-surface-card/40 border border-forest-700/25 rounded-2xl p-5
      hover:border-forest-600/40 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl bg-forest-800/70 border border-forest-700/30
          flex items-center justify-center text-sm font-bold text-emerald-300 shrink-0"
        >
          {post.anonName?.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">
              {post.anonName}
            </span>
            <span className="text-[10px] text-text-muted bg-forest-800/50 px-2 py-0.5 rounded-full">
              Anonymous
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1
              ${
                post.mode === "global"
                  ? "bg-blue-500/10 text-blue-300"
                  : "bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {post.mode === "global" ? (
                <>
                  <Globe size={9} /> Global
                </>
              ) : (
                <>
                  <Building2 size={9} /> {post.institute || "Institute"}
                </>
              )}
            </span>
          </div>
          <span className="text-[11px] text-text-muted">
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="relative rounded-xl overflow-hidden mb-3 bg-surface-card">
          {post.media[mediaIndex].type === "video" ? (
            <video
              src={post.media[mediaIndex].url}
              controls
              className="w-full max-h-80 object-contain"
            />
          ) : (
            <img
              src={post.media[mediaIndex].url}
              alt=""
              className="w-full max-h-80 object-cover"
              loading="lazy"
            />
          )}

          {post.media.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === mediaIndex
                      ? "bg-white scale-125"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-forest-700/15">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-all duration-200
            ${liked ? "text-red-400" : "text-text-muted hover:text-red-400"}`}
        >
          <Heart
            size={15}
            fill={liked ? "currentColor" : "none"}
            strokeWidth={1.8}
          />
          <span className="text-xs">{likeCount > 0 ? likeCount : ""}</span>
        </button>

        <button
          onClick={() => {
            setShowComments((v) => !v);
          }}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-emerald-400
            transition-colors duration-200"
        >
          <MessageCircle size={15} strokeWidth={1.8} />
          <span className="text-xs">
            {commentCount > 0 ? commentCount : ""}
          </span>
          {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} />}
    </article>
  );
};

export default PostCard;
