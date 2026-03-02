import { useState, useRef } from "react";
import {
  Image,
  Film,
  X,
  Send,
  Loader2,
  Globe,
  Building2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/Authcontext";
import { communityService } from "../../services/communityService";

const CreatePost = ({ mode, onCreated, onModerationWarning }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // { file, preview, type }
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const anonName = user
    ? (() => {
        const seed =
          user._id?.split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 0;
        const adj = [
          "Calm",
          "Brave",
          "Kind",
          "Quiet",
          "Bright",
          "Gentle",
          "Bold",
          "Wise",
          "Hopeful",
          "Serene",
          "Curious",
          "Warm",
          "Steady",
          "Mindful",
          "Resilient",
        ];
        const ani = [
          "Panda",
          "Owl",
          "Deer",
          "Fox",
          "Wolf",
          "Eagle",
          "Dolphin",
          "Otter",
          "Crane",
          "Lynx",
          "Raven",
          "Bear",
          "Swan",
          "Hawk",
          "Tiger",
        ];
        return `${adj[seed % adj.length]} ${ani[(seed >> 2) % ani.length]}`;
      })()
    : "Anonymous";

  const addFiles = (rawFiles) => {
    const toAdd = Array.from(rawFiles).slice(0, 4 - files.length);
    const mapped = toAdd.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    }));
    setFiles((prev) => [...prev, ...mapped].slice(0, 4));
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !files.length) return;

    setPosting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("mode", mode);
      if (content.trim()) fd.append("content", content.trim());
      files.forEach((f) => fd.append("media", f.file));

      const res = await communityService.createPost(fd);
      setContent("");
      setFiles([]);
      setExpanded(false);
      onCreated?.(res.data);
    } catch (err) {
      if (err.strikes !== undefined) {
        // Moderation warning from backend
        onModerationWarning?.(err);
        setError(err.message);
      } else {
        setError(err.message || "Failed to post. Please try again.");
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-surface-card/50 border border-forest-700/30 rounded-2xl p-4">
      {/* Avatar + input trigger */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl bg-forest-800/60 border border-forest-700/30
          flex items-center justify-center text-sm font-bold text-emerald-300 shrink-0"
        >
          {anonName.charAt(0)}
        </div>

        <div className="flex-1">
          <div
            onClick={() => setExpanded(true)}
            className={`w-full px-4 py-2.5 rounded-xl bg-surface-card border border-forest-700/30
              text-sm text-text-muted cursor-text transition-all duration-200
              hover:border-forest-600 ${expanded ? "hidden" : "block"}`}
          >
            Share how you're feeling…
          </div>

          {expanded && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-emerald-400 font-medium">
                  {anonName}
                </span>
                <span className="text-[10px] text-text-muted bg-forest-800/50 px-2 py-0.5 rounded-full">
                  Anonymous
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1
                  ${
                    mode === "global"
                      ? "bg-blue-500/10 text-blue-300"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {mode === "global" ? (
                    <Globe size={9} />
                  ) : (
                    <Building2 size={9} />
                  )}
                  {mode === "global" ? "Global" : "Institute"}
                </span>
              </div>

              <textarea
                autoFocus
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? This is a safe, anonymous space…"
                maxLength={5000}
                className="w-full px-3.5 py-2.5 bg-surface-card rounded-xl resize-none
                  text-sm text-text-primary placeholder:text-text-muted
                  border border-forest-700/40 focus:border-forest-600
                  focus:outline-none focus:ring-2 focus:ring-forest-600/30
                  transition-all duration-200"
              />

              {/* Media previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-video bg-surface-card"
                    >
                      {f.type === "video" ? (
                        <video
                          src={f.preview}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={f.preview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle
                    size={14}
                    className="text-red-400 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {/* Bottom toolbar */}
              <div className="flex items-center gap-2">
                {files.length < 4 && (
                  <>
                    <button
                      type="button"
                      onClick={() => imageRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-emerald-300
                        transition-colors duration-200"
                      title="Add image"
                    >
                      <Image size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => videoRef.current?.click()}
                      className="p-2 rounded-lg hover:bg-surface-hover text-text-muted hover:text-emerald-300
                        transition-colors duration-200"
                      title="Add video"
                    >
                      <Film size={16} />
                    </button>
                  </>
                )}

                <p className="text-[10px] text-text-muted ml-1">
                  {content.length}/5000
                </p>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false);
                      setError("");
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-text-muted hover:text-text-primary
                      transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={posting || (!content.trim() && !files.length)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl
                      bg-forest-700 hover:bg-forest-600 text-white text-xs font-medium
                      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {posting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>

              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                multiple
                hidden
                onChange={(e) => addFiles(e.target.files)}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
