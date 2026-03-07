import { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "../components/Layout";
import {
  createPost,
  getFeed,
  getMyPosts,
  likePost,
  repostPost,
  bookmarkPost,
  addComment,
  replyComment,
  getComments,
  reportPost,
  deletePost,
  editPost,
  getBookmarkedPosts,
} from "../api/communityService";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     "#D85E82",
  primaryDark: "#B8456A",
  primaryGlow: "rgba(216,94,130,0.15)",
  secondary:   "#603377",
  bgLight:     "#F3E6EE",
  white:       "#FFFFFF",
  textDark:    "#2C1028",
  textMid:     "#5A3060",
  textSoft:    "#9B7AAA",
  border:      "#E8C8D8",
  sand:        "#FDF6FA",
  grad:        "linear-gradient(135deg, #D85E82, #603377)",
};

const CATS = [
  { id: "all",       label: "All Posts",       icon: "🌸" },
  { id: "period",    label: "Period Health",   icon: "🩸" },
  { id: "pcos",      label: "PCOS",            icon: "🧬" },
  { id: "mental",    label: "Mental Wellness", icon: "🧠" },
  { id: "nutrition", label: "Nutrition",       icon: "🥗" },
  { id: "fitness",   label: "Fitness",         icon: "💪" },
  { id: "fertility", label: "Fertility",       icon: "🌱" },
];

const TAG_STYLE = {
  "PCOS":            { bg: "#F5F3FF", c: "#7C3AED" },
  "Mental Wellness": { bg: "#EFF6FF", c: "#2563EB" },
  "Fitness":         { bg: "#FFFBEB", c: "#D97706" },
  "Nutrition":       { bg: "#F0FDF4", c: "#16A34A" },
  "Period Health":   { bg: C.bgLight, c: C.primaryDark },
  "Fertility":       { bg: "#F0FDFA", c: "#0F766E" },
};

const catToTag = (categoryId) =>
  CATS.find((c) => c.id === categoryId)?.label ?? "Period Health";

const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp,image/gif";
const ACCEPTED_VIDEO = "video/mp4,video/webm,video/quicktime";
const MAX_FILE_MB    = 50;

// ─── Feed Tabs ────────────────────────────────────────────────────────────────
const FEED_TABS = [
  { id: "community", label: "Community Feed", icon: "🌸" },
  { id: "my-posts",  label: "My Posts",       icon: "📝" },
  { id: "reposts",   label: "Reposts",        icon: "🔁" },
  { id: "bookmarks", label: "Bookmarks",      icon: "🔖" },
];

// ─── Share options ─────────────────────────────────────────────────────────────
const SHARE_OPTIONS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    getUrl: (text, url) =>
      `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#229ED9",
    bg: "#EFF9FF",
    border: "#BAE6FD",
    getUrl: (text, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "#000000",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    getUrl: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.74-8.855L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    getUrl: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

// ─── Share Sheet ──────────────────────────────────────────────────────────────
function ShareSheet({ post, onClose }) {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [nativeTried, setNativeTried] = useState(false);

  // Build share content
  const postUrl  = `${window.location.origin}/community/post/${post.id}`;
  const shareText = post.title
    ? `"${post.title}" — shared from SheCare Community 🌸`
    : "Check out this post on SheCare Community 🌸";

  // On mobile, attempt native share API first
  useEffect(() => {
    if (isMobile && navigator.share && !nativeTried) {
      setNativeTried(true);
      navigator
        .share({ title: post.title || "SheCare Post", text: shareText, url: postUrl })
        .then(onClose)
        .catch(() => {}); // user cancelled → fall through to sheet
    }
  }, []); // eslint-disable-line

  const handleOption = async (opt) => {
    if (opt.id === "copy") {
      try {
        await navigator.clipboard.writeText(postUrl);
      } catch {
        // fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = postUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1400);
      return;
    }
    window.open(opt.getUrl(shareText, postUrl), "_blank", "noopener,noreferrer,width=620,height=520");
    onClose();
  };

  const handleCopyInline = async () => {
    try { await navigator.clipboard.writeText(postUrl); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = postUrl; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(44,16,40,0.52)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 20,
      }}
    >
      <div style={{
        background: C.white,
        borderRadius: isMobile ? "24px 24px 0 0" : 24,
        padding: isMobile ? "20px 18px 36px" : "28px 28px",
        width: "100%",
        maxWidth: isMobile ? "100%" : 420,
        boxShadow: "0 24px 80px rgba(44,16,40,0.28)",
        animation: "shareSlideUp 0.22s cubic-bezier(0.34,1.4,0.64,1)",
      }}>

        {/* Drag handle on mobile */}
        {isMobile && (
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 700, color: C.textDark, marginBottom: 3 }}>
              Share this post
            </h3>
            {post.title && (
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                "{post.title}"
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ flexShrink: 0, background: C.bgLight, border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: C.textSoft, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        {/* Link preview + copy */}
        <div style={{
          background: C.sand, border: `1.5px solid ${C.border}`, borderRadius: 12,
          padding: "10px 12px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.textSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2 }}>Post link</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textMid, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {postUrl}
            </p>
          </div>
          <button
            onClick={handleCopyInline}
            style={{
              flexShrink: 0,
              background: copied ? "#F0FDF4" : C.bgLight,
              border: `1.5px solid ${copied ? "#BBF7D0" : C.border}`,
              borderRadius: 8, padding: "6px 13px",
              fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800,
              color: copied ? "#16A34A" : C.primaryDark,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>

        {/* Social options grid */}
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
          Share to
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SHARE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleOption(opt)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: opt.bg,
                border: `1.5px solid ${opt.border}`,
                borderRadius: 14, padding: "12px 14px",
                cursor: "pointer", transition: "all 0.17s",
                fontFamily: "'Nunito', sans-serif",
                textAlign: "left",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 5px 16px rgba(0,0,0,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{opt.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: opt.color }}>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Animation */}
        <style>{`
          @keyframes shareSlideUp {
            from { transform: translateY(50px); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Banner({ type, message, onClose }) {
  if (!message) return null;
  const s = {
    error:   { bg: "#FFF0F4", border: "#F4B8CB", icon: "⚠️", color: C.primaryDark },
    success: { bg: "#F0FDF4", border: "#A8E6C3", icon: "✅", color: "#1E7E4A" },
    info:    { bg: C.bgLight, border: C.border,  icon: "💡", color: C.secondary },
  }[type] || {};
  return (
    <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span>{s.icon}</span>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: s.color, fontWeight: 600, flex: 1 }}>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 16 }}>✕</button>}
    </div>
  );
}

function AnonymousToggle({ anonymous, onChange, username }) {
  return (
    <div onClick={() => onChange(!anonymous)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: anonymous ? C.bgLight : "#F0FDF4",
      border: `2px solid ${anonymous ? C.border : "#A8E6C3"}`,
      borderRadius: 12, padding: "12px 16px", cursor: "pointer",
      transition: "all 0.2s", userSelect: "none",
    }}>
      <div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 2 }}>
          {anonymous ? "🔒 Posting Anonymously" : `👤 Posting as ${username || "You"}`}
        </p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft }}>
          {anonymous ? "Your identity is hidden from everyone" : "Your username will be visible to others"}
        </p>
      </div>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: anonymous ? C.primary : "#CBD5E0", position: "relative", transition: "background 0.25s", flexShrink: 0, marginLeft: 12 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: anonymous ? 23 : 3, transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

// ─── Media Picker ─────────────────────────────────────────────────────────────
function MediaPicker({ mediaFile, mediaType, mediaPreview, onSelect, onRemove }) {
  const imgRef = useRef();
  const vidRef = useRef();

  return (
    <div>
      <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>
        Media <span style={{ fontWeight: 400, color: C.textSoft }}>(optional · max {MAX_FILE_MB}MB)</span>
      </label>

      {mediaPreview ? (
        <div style={{ position: "relative", marginBottom: 12, borderRadius: 14, overflow: "hidden", border: `1.5px solid ${C.border}` }}>
          {mediaType === "image" ? (
            <img src={mediaPreview} alt="preview" style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
          ) : (
            <video src={mediaPreview} controls style={{ width: "100%", maxHeight: 260, display: "block" }} />
          )}
          {mediaFile && (
            <div style={{ position: "absolute", bottom: 8, left: 10, background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 8, padding: "3px 10px", fontFamily: "'Nunito', sans-serif", fontSize: 11, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mediaFile.name}
            </div>
          )}
          <button onClick={onRemove} style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.55)", color: "#fff", border: "none",
            borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={imgRef} type="file" accept={ACCEPTED_IMAGE} style={{ display: "none" }}
            onChange={e => { onSelect(e.target.files[0], "image"); e.target.value = ""; }} />
          <input ref={vidRef} type="file" accept={ACCEPTED_VIDEO} style={{ display: "none" }}
            onChange={e => { onSelect(e.target.files[0], "video"); e.target.value = ""; }} />
          {[
            { icon: "🖼️", label: "Add Image", ref: imgRef },
            { icon: "🎥", label: "Add Video", ref: vidRef },
          ].map(b => (
            <button key={b.label} onClick={() => b.ref.current?.click()} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: `2px dashed ${C.border}`, borderRadius: 12, padding: "12px",
              background: C.sand, color: C.textSoft,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.bgLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSoft; e.currentTarget.style.background = C.sand; }}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini anon toggle (for comments) ─────────────────────────────────────────
function MiniToggle({ active, onToggle, label }) {
  return (
    <div onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none",
      background: active ? C.bgLight : "#F0FFF4",
      border: `1.5px solid ${active ? C.border : "#A8E6C3"}`,
      borderRadius: 20, padding: "5px 12px 5px 8px", transition: "all 0.2s",
    }}>
      <div style={{ width: 28, height: 16, borderRadius: 8, background: active ? C.primary : "#CBD5E0", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: active ? 14 : 2, transition: "left 0.2s" }} />
      </div>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: active ? C.primaryDark : "#16A34A" }}>{label}</span>
    </div>
  );
}

// ─── Comments Section ─────────────────────────────────────────────────────────
function CommentsSection({ postId, currentUsername, onCommentAdded }) {
  const [comments,   setComments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [text,       setText]       = useState("");
  const [anonymous,  setAnonymous]  = useState(true);
  const [replyTo,    setReplyTo]    = useState(null);
  const [replyText,  setReplyText]  = useState("");
  const [replyAnon,  setReplyAnon]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    getComments(postId)
      .then(setComments)
      .catch(() => setError("Could not load comments."))
      .finally(() => setLoading(false));
  }, [postId]);

  const submitComment = async () => {
    if (!text.trim()) return;
    setError(""); setSubmitting(true);
    try {
      const saved = await addComment(postId, { content: text.trim(), anonymous });
      setComments(prev => [saved, ...prev]);
      setText("");
      onCommentAdded?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to post comment.");
    } finally { setSubmitting(false); }
  };

  const submitReply = async (commentId) => {
    if (!replyText.trim()) return;
    setError(""); setSubmitting(true);
    try {
      const saved = await replyComment(commentId, { content: replyText.trim(), anonymous: replyAnon });
      setComments(prev => [...prev, saved]);
      setReplyTo(null); setReplyText(""); setReplyAnon(true);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to post reply.");
    } finally { setSubmitting(false); }
  };

  const inputStyle = {
    flex: 1, border: `2px solid ${C.border}`, borderRadius: 12,
    padding: "10px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 13,
    outline: "none", color: C.textDark, background: C.sand,
  };
  const btnStyle = {
    background: C.grad, color: "white", border: "none", borderRadius: 12,
    padding: "0 18px", fontFamily: "'Nunito', sans-serif", fontSize: 13,
    fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1, whiteSpace: "nowrap", minHeight: 40,
  };

  const roots   = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c =>  c.parentCommentId);

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.bgLight}` }}>
      {error && <Banner type="error" message={error} onClose={() => setError("")} />}

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)}
            placeholder="Write a supportive reply…" style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.primary}
            onBlur={e  => e.target.style.borderColor = C.border}
            onKeyDown={e => e.key === "Enter" && submitComment()} />
          <button onClick={submitComment} disabled={submitting} style={btnStyle}>
            {submitting ? "…" : "Reply"}
          </button>
        </div>
        <MiniToggle active={anonymous} onToggle={() => setAnonymous(v => !v)}
          label={anonymous ? "🔒 Anonymous" : `👤 ${currentUsername || "You"}`} />
      </div>

      {loading ? (
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>Loading comments…</p>
      ) : roots.length === 0 ? (
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>No comments yet — be the first! 🌸</p>
      ) : roots.map(c => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <div style={{ background: C.bgLight, borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 4 }}>
              {c.anonymous ? "Anonymous" : c.username}
              <span style={{ fontWeight: 400, color: C.textSoft, marginLeft: 8 }}>
                {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textDark, lineHeight: 1.6 }}>{c.content}</p>
            <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyAnon(true); setReplyText(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 4, padding: 0 }}>
              {replyTo === c.id ? "Cancel" : "↩ Reply"}
            </button>
          </div>

          {replies.filter(r => r.parentCommentId === c.id).map(r => (
            <div key={r.id} style={{ marginLeft: 24, marginTop: 6, background: "#FAF3FB", borderRadius: 10, padding: "8px 12px", borderLeft: `3px solid ${C.border}` }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 2 }}>
                {r.anonymous ? "Anonymous" : r.username}
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textDark }}>{r.content}</p>
            </div>
          ))}

          {replyTo === c.id && (
            <div style={{ marginLeft: 24, marginTop: 6 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…" style={{ ...inputStyle, fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e  => e.target.style.borderColor = C.border}
                  onKeyDown={e => e.key === "Enter" && submitReply(c.id)} />
                <button onClick={() => submitReply(c.id)} disabled={submitting}
                  style={{ ...btnStyle, fontSize: 12, padding: "0 14px" }}>
                  {submitting ? "…" : "Send"}
                </button>
              </div>
              <MiniToggle active={replyAnon} onToggle={() => setReplyAnon(v => !v)}
                label={replyAnon ? "🔒 Anonymous" : `👤 ${currentUsername || "You"}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Media Lightbox ───────────────────────────────────────────────────────────
function MediaLightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  const item = items[idx];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 18, right: 22, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>✕</button>

      {items.length > 1 && (
        <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 14px", color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)" }}>
          {idx + 1} / {items.length}
        </div>
      )}

      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>‹</button>
      )}
      {idx < items.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>›</button>
      )}

      <div onClick={e => e.stopPropagation()} style={{ maxWidth: "88vw", maxHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.type === "video" ? (
          <video src={item.url} controls autoPlay style={{ maxWidth: "88vw", maxHeight: "88vh", borderRadius: 12 }} />
        ) : (
          <img src={item.url} alt="" style={{ maxWidth: "88vw", maxHeight: "88vh", borderRadius: 12, objectFit: "contain", userSelect: "none" }} />
        )}
      </div>

      {items.length > 1 && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {items.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 20 : 8, height: 8, borderRadius: 4, background: i === idx ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", transition: "all 0.2s", padding: 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Media Grid ───────────────────────────────────────────────────────────────
function MediaGrid({ mediaItems, onOpen }) {
  const count = mediaItems.length;
  if (count === 0) return null;

  const cellStyle = (extra = {}) => ({ overflow: "hidden", borderRadius: 10, cursor: "pointer", background: "#111", position: "relative", ...extra });
  const imgStyle = { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.2s" };

  const Thumb = ({ item, index, style = {} }) => (
    <div style={cellStyle(style)} onClick={() => onOpen(index)}
      onMouseEnter={e => { const img = e.currentTarget.querySelector("img,video"); if (img) img.style.transform = "scale(1.04)"; }}
      onMouseLeave={e => { const img = e.currentTarget.querySelector("img,video"); if (img) img.style.transform = "scale(1)"; }}
    >
      {item.type === "video" ? (
        <>
          <video src={item.url} muted style={{ ...imgStyle }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)", pointerEvents: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</div>
          </div>
        </>
      ) : (
        <img src={item.url} alt="" style={imgStyle} />
      )}
      {index === 3 && count > 4 && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800 }}>+{count - 4}</span>
        </div>
      )}
    </div>
  );

  const visible = mediaItems.slice(0, 4);
  const H = 260;

  if (count === 1) {
    return (
      <div style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "#111", maxHeight: H + 40 }} onClick={() => onOpen(0)}>
        {visible[0].type === "video" ? (
          <video src={visible[0].url} controls style={{ width: "100%", maxHeight: H + 40, display: "block", objectFit: "contain" }} />
        ) : (
          <img src={visible[0].url} alt="" style={{ width: "100%", maxHeight: H + 40, objectFit: "cover", display: "block" }} />
        )}
      </div>
    );
  }
  if (count === 2) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, height: H, borderRadius: 14, overflow: "hidden" }}>
      {visible.map((item, i) => <Thumb key={i} item={item} index={i} style={{ height: "100%" }} />)}
    </div>
  );
  if (count === 3) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, height: H, borderRadius: 14, overflow: "hidden" }}>
      <Thumb item={visible[0]} index={0} style={{ height: "100%", gridRow: "span 2" }} />
      <Thumb item={visible[1]} index={1} style={{ height: (H - 3) / 2 }} />
      <Thumb item={visible[2]} index={2} style={{ height: (H - 3) / 2 }} />
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${(H - 3) / 2}px ${(H - 3) / 2}px`, gap: 3, borderRadius: 14, overflow: "hidden" }}>
      {visible.map((item, i) => <Thumb key={i} item={item} index={i} style={{ height: "100%" }} />)}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ post, onClose, onSaved, username }) {
  const isMobile = useIsMobile();
  const body0  = post.body ?? (post.content ?? "").split("\n").slice(1).join("\n");
  const title0 = post.title ?? (post.content ?? "").split("\n")[0] ?? "";
  const cat0   = CATS.find(c => catToTag(c.id) === post.tag)?.id ?? "period";

  const [form,        setForm]        = useState({ title: title0, body: body0, category: cat0, anonymous: post.anonymous ?? true });
  const [mediaFile,   setMediaFile]   = useState(null);
  const [mediaType,   setMediaType]   = useState(null);
  const [mediaPreview,setMediaPreview]= useState(post.mediaUrls?.[0] ?? post.mediaUrl ?? null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const handleMediaSelect = (file, type) => {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setError(`File too large. Max ${MAX_FILE_MB}MB.`); return; }
    setMediaFile(file); setMediaType(type);
    const reader = new FileReader();
    reader.onload = e => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => { setMediaFile(null); setMediaType(null); setMediaPreview(null); };

  const submit = async () => {
    setError("");
    if (!form.title.trim() || !form.body.trim()) { setError("Please fill in both title and story."); return; }
    setSubmitting(true);
    try {
      const postData = { content: `${form.title.trim()}\n${form.body.trim()}`, category: form.category, anonymous: form.anonymous, hashtags: post.hashtags ?? [] };
      const saved = await editPost(post.id, postData, mediaFile || null);
      onSaved({ ...saved, title: form.title.trim(), body: form.body.trim(), tag: catToTag(saved.category), avatar: post.avatar ?? "🌸", liked: post.liked, saved: post.saved, reposted: post.reposted, mediaUrl: saved.mediaUrls?.[0] ?? mediaPreview ?? null, mediaType: saved.mediaType ?? mediaType ?? post.mediaType ?? null });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not save changes.");
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,16,40,0.4)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div style={{ background: C.white, borderRadius: isMobile ? "24px 24px 0 0" : 28, padding: isMobile ? "28px 20px 36px" : "36px 40px", width: "100%", maxWidth: isMobile ? "100%" : 540, boxShadow: "0 24px 80px rgba(44,16,40,0.20)", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.textDark }}>Edit Post ✏️</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, fontSize: 22 }}>✕</button>
        </div>

        <Banner type="error" message={error} onClose={() => setError("")} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", background: C.sand, color: C.textDark }}>
              {CATS.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", color: C.textDark, background: C.sand, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border} />
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Your Story *</label>
            <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} rows={4}
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", resize: "none", color: C.textDark, background: C.sand, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border} />
          </div>

          <MediaPicker mediaFile={mediaFile} mediaType={mediaType} mediaPreview={mediaPreview} onSelect={handleMediaSelect} onRemove={removeMedia} />
          <AnonymousToggle anonymous={form.anonymous} onChange={val => setForm(p => ({ ...p, anonymous: val }))} username={username} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={onClose} style={{ border: `2px solid ${C.border}`, borderRadius: 12, padding: "13px", background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ background: submitting ? C.border : C.grad, color: C.white, border: "none", borderRadius: 12, padding: "13px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`, transition: "all 0.2s" }}>
              {submitting ? "Saving…" : "Save Changes →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLikeToggle, onSaveToggle, onRepostToggle, onReportSuccess, onDeleted, onEdited, currentUsername, isOwn, isRepost }) {
  const [expanded,     setExpanded]     = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare,    setShowShare]    = useState(false); // ← NEW
  const [liking,       setLiking]       = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [reposting,    setReposting]    = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [error,        setError]        = useState("");
  const [lightboxIdx,  setLightboxIdx]  = useState(null);

  const ts = TAG_STYLE[post.tag] || { bg: C.bgLight, c: C.primaryDark };

  const mediaItems = (() => {
    const urls  = post.mediaUrls?.length ? post.mediaUrls : post.mediaUrl ? [post.mediaUrl] : [];
    const mtype = (post.mediaType ?? "").toLowerCase().includes("video") ? "video" : "image";
    return urls.map(url => ({ url, type: mtype }));
  })();

  const handleLike = async () => {
    if (liking) return; setLiking(true);
    try { await likePost(post.id); onLikeToggle(post.id); }
    catch (e) { setError(e?.response?.data?.message || "Could not like post."); }
    finally { setLiking(false); }
  };

  const handleSave = async () => {
    if (saving) return; setSaving(true);
    try { await bookmarkPost(post.id); onSaveToggle(post.id); }
    catch (e) { setError(e?.response?.data?.message || "Could not save post."); }
    finally { setSaving(false); }
  };

  const handleRepost = async () => {
    if (reposting) return; setReposting(true);
    try { await repostPost(post.id); onRepostToggle(post.id); }
    catch (e) { setError(e?.response?.data?.message || "Could not repost."); }
    finally { setReposting(false); }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason) return;
    try { await reportPost(post.id, reason); onReportSuccess?.("Post reported. Our team will review it. 🛡️"); }
    catch { setError("Could not submit report."); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try { await deletePost(post.id); onDeleted?.(post.id); }
    catch (e) { setError(e?.response?.data?.message || "Could not delete post."); setDeleting(false); }
  };

  const body = post.body ?? post.content ?? "";
  const displayTitle = post.title ?? body.split("\n")[0];
  const displayBody  = post.body  ?? (body.includes("\n") ? body.split("\n").slice(1).join("\n") : body);

  const commentCount = post.commentCount ?? post.comments ?? 0;
  const likeCount    = post.likeCount    ?? post.likes    ?? 0;
  const repostCount  = post.repostCount  ?? post.reposts  ?? 0;

  return (
    <>
      {showEdit && (
        <EditModal
          post={post}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setShowEdit(false); onEdited?.(updated); }}
          username={currentUsername}
        />
      )}
      {lightboxIdx !== null && (
        <MediaLightbox items={mediaItems} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* ── Share Sheet (renders when showShare is true) ── */}
      {showShare && (
        <ShareSheet post={post} onClose={() => setShowShare(false)} />
      )}

      <div style={{
        background: C.white, borderRadius: 22,
        border: `1px solid ${isOwn ? C.primary + "44" : C.border}`,
        boxShadow: isOwn
          ? `0 2px 12px ${C.primaryGlow}, inset 0 0 0 1px ${C.primary}22`
          : "0 2px 12px rgba(96,51,119,0.06)",
        transition: "box-shadow 0.2s",
        position: "relative",
        width: "100%", minWidth: 0, boxSizing: "border-box", overflow: "hidden",
        opacity: deleting ? 0.5 : 1,
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(96,51,119,0.11)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = isOwn ? `0 2px 12px ${C.primaryGlow}, inset 0 0 0 1px ${C.primary}22` : "0 2px 12px rgba(96,51,119,0.06)"}
      >
        {/* ── Repost banner ── */}
        {isRepost && (
          <div style={{ background: "#F0FDF4", borderBottom: "1px solid #BBF7D0", padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>🔁</span>
            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: "#16A34A" }}>You reposted this</span>
          </div>
        )}

        {/* Own post Edit/Delete actions */}
        {isOwn && (
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, zIndex: 1 }}>
            <button onClick={() => setShowEdit(true)} title="Edit post" style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: C.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              ✏️ Edit
            </button>
            <button onClick={handleDelete} disabled={deleting} title="Delete post" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #FCA5A5", borderRadius: 8, padding: "4px 10px", fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: "#DC2626", cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              🗑️ {deleting ? "…" : "Delete"}
            </button>
          </div>
        )}

        <div style={{ padding: "18px 16px", paddingTop: isOwn ? 50 : 18 }}>
          {error && <Banner type="error" message={error} onClose={() => setError("")} />}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.bgLight}, ${C.border})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {post.avatar || "🌸"}
              </div>
              <div>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark }}>
                  {post.anonymous ? "Anonymous" : post.username}
                  {isOwn && !isRepost && (
                    <span style={{ marginLeft: 6, fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, background: C.bgLight, color: C.primaryDark, borderRadius: 20, padding: "2px 8px" }}>You</span>
                  )}
                </p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft }}>
                  {post.createdAt ? new Date(post.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : post.time}
                  {post.editedAt && <span style={{ marginLeft: 6, color: C.textSoft, fontStyle: "italic" }}>(edited)</span>}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: ts.bg, color: ts.c }}>
                {post.tag}
              </span>
              {!isOwn && (
                <button onClick={handleReport} title="Report post" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textSoft, padding: "4px", lineHeight: 1 }}>🚩</button>
              )}
            </div>
          </div>

          {displayTitle && (
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 8, lineHeight: 1.35 }}>
              {displayTitle}
            </h3>
          )}

          {displayBody && (
            <>
              <p style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.75,
                overflow: expanded ? "visible" : "hidden",
                display: expanded ? "block" : "-webkit-box",
                WebkitLineClamp: expanded ? "unset" : 3,
                WebkitBoxOrient: "vertical",
              }}>{displayBody}</p>
              {displayBody.length > 160 && (
                <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 4, padding: 0 }}>
                  {expanded ? "Show less" : "Read more →"}
                </button>
              )}
            </>
          )}

          {mediaItems.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <MediaGrid mediaItems={mediaItems} onOpen={i => setLightboxIdx(i)} />
            </div>
          )}

          {/* ── Action bar ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.bgLight}`, flexWrap: "wrap" }}>
            <ActionBtn icon="❤️" label={likeCount}    onClick={handleLike}   disabled={liking}    active={post.liked} />
            <ActionBtn icon="💬" label={commentCount} onClick={() => setShowComments(v => !v)} active={showComments} />
            <ActionBtn icon="🔁" label={repostCount}  onClick={handleRepost} disabled={reposting} active={post.reposted} activeColor="#16A34A" />
            <ActionBtn icon={post.saved ? "🔖" : "📌"} label={post.saved ? "Saved" : "Save"} onClick={handleSave} disabled={saving} active={post.saved} />

            {/* ── Share Button (replaces the old placeholder) ── */}
            <button
              onClick={() => setShowShare(true)}
              style={{
                marginLeft: "auto",
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
                color: C.textSoft, padding: "6px 10px", borderRadius: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgLight; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none";    e.currentTarget.style.color = C.textSoft; }}
            >
              {/* Upload / share arrow icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </button>
          </div>

          {showComments && (
            <CommentsSection
              postId={post.id}
              currentUsername={currentUsername}
              onCommentAdded={() => { post.commentCount = (post.commentCount ?? 0) + 1; }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ActionBtn({ icon, label, onClick, disabled, active, activeColor }) {
  const ac = activeColor || C.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", gap: 5, background: "none", border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
      color: active ? ac : C.textSoft,
      padding: "6px 10px", borderRadius: 8, transition: "all 0.15s",
      opacity: disabled ? 0.6 : 1,
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = C.bgLight; e.currentTarget.style.color = ac; } }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = active ? ac : C.textSoft; }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onPosted, username }) {
  const isMobile = useIsMobile();
  const [newPost,      setNewPost]      = useState({ title: "", body: "", category: "period", anonymous: true });
  const [mediaFile,    setMediaFile]    = useState(null);
  const [mediaType,    setMediaType]    = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  const handleMediaSelect = (file, type) => {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setError(`File too large. Maximum size is ${MAX_FILE_MB}MB.`); return; }
    setMediaFile(file); setMediaType(type);
    const reader = new FileReader();
    reader.onload = e => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeMedia = () => { setMediaFile(null); setMediaType(null); setMediaPreview(null); };

  const submit = async () => {
    setError("");
    if (!newPost.title.trim() || !newPost.body.trim()) { setError("Please fill in both the title and your story."); return; }
    setSubmitting(true);
    try {
      const postData = { content: `${newPost.title.trim()}\n${newPost.body.trim()}`, category: newPost.category, anonymous: newPost.anonymous, hashtags: [] };
      const saved = await createPost(postData, mediaFile || null);
      onPosted({ ...saved, title: newPost.title.trim(), body: newPost.body.trim(), tag: catToTag(saved.category), avatar: "🌸", liked: false, saved: false, reposted: false, mediaUrl: saved.mediaUrls?.[0] ?? mediaPreview ?? null, mediaType: saved.mediaType ?? mediaType ?? null });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not create post. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,16,40,0.4)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div style={{ background: C.white, borderRadius: isMobile ? "24px 24px 0 0" : 28, padding: isMobile ? "28px 20px 36px" : "36px 40px", width: "100%", maxWidth: isMobile ? "100%" : 540, boxShadow: "0 24px 80px rgba(44,16,40,0.20)", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.textDark }}>Share Your Story 🌸</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, fontSize: 22 }}>✕</button>
        </div>

        <Banner type="error" message={error} onClose={() => setError("")} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Category</label>
            <select value={newPost.category} onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", background: C.sand, color: C.textDark }}>
              {CATS.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Title *</label>
            <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              placeholder="What do you want to share or ask?"
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", color: C.textDark, background: C.sand, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border} />
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Your Story *</label>
            <textarea value={newPost.body} onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
              placeholder="Share your experience, tip or question…" rows={4}
              style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", resize: "none", color: C.textDark, background: C.sand, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e  => e.target.style.borderColor = C.border} />
          </div>

          <MediaPicker mediaFile={mediaFile} mediaType={mediaType} mediaPreview={mediaPreview} onSelect={handleMediaSelect} onRemove={removeMedia} />
          <AnonymousToggle anonymous={newPost.anonymous} onChange={val => setNewPost(p => ({ ...p, anonymous: val }))} username={username} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={onClose} style={{ border: `2px solid ${C.border}`, borderRadius: 12, padding: "13px", background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ background: submitting ? C.border : C.grad, color: C.white, border: "none", borderRadius: 12, padding: "13px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`, transition: "all 0.2s" }}>
              {submitting ? (mediaFile ? "Uploading & Posting…" : "Posting…") : newPost.anonymous ? "Post Anonymously →" : `Post as ${username} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function MyPostsEmpty({ onCompose }) {
  return (
    <div style={{ background: C.white, borderRadius: 22, padding: "40px 20px", textAlign: "center", border: `1.5px dashed ${C.border}`, width: "100%", boxSizing: "border-box" }}>
      <span style={{ fontSize: 52, display: "block", marginBottom: 16 }}>✏️</span>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>You haven't posted yet</p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
        Share your first story with the community — your voice matters here 🌸
      </p>
      <button onClick={onCompose} style={{ background: C.grad, color: C.white, border: "none", borderRadius: 14, padding: "13px 28px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}` }}>
        ✏️ Share Your Story
      </button>
    </div>
  );
}

function BookmarksEmpty() {
  return (
    <div style={{ background: C.white, borderRadius: 22, padding: "40px 20px", textAlign: "center", border: `1.5px dashed ${C.border}`, width: "100%", boxSizing: "border-box" }}>
      <span style={{ fontSize: 52, display: "block", marginBottom: 16 }}>🔖</span>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>No bookmarks yet</p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, maxWidth: 320, margin: "0 auto" }}>
        Save posts you want to revisit — tap 📌 on any post to bookmark it.
      </p>
    </div>
  );
}

// ─── Reposts empty state ──────────────────────────────────────────────────────
function RepostsEmpty() {
  return (
    <div style={{ background: C.white, borderRadius: 22, padding: "40px 20px", textAlign: "center", border: `1.5px dashed ${C.border}`, width: "100%", boxSizing: "border-box" }}>
      <span style={{ fontSize: 52, display: "block", marginBottom: 16 }}>🔁</span>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>No reposts yet</p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, maxWidth: 320, margin: "0 auto" }}>
        Posts you repost will appear here. Hit 🔁 on any post to reshare it!
      </p>
    </div>
  );
}

// ─── Mobile Category Scroller ─────────────────────────────────────────────────
function MobileCategoryScroller({ cat, setCat }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
      {CATS.map(c => (
        <button key={c.id} onClick={() => setCat(c.id)} style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
          padding: "8px 14px", borderRadius: 20,
          background: cat === c.id ? C.grad : C.white,
          color: cat === c.id ? C.white : C.textSoft,
          fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700,
          cursor: "pointer", boxShadow: cat === c.id ? `0 2px 10px ${C.primaryGlow}` : `0 1px 4px rgba(0,0,0,0.06)`,
          border: cat === c.id ? "none" : `1px solid ${C.border}`,
        }}>
          <span>{c.icon}</span>{c.label}
        </button>
      ))}
    </div>
  );
}

// ─── CommunityPage ────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const isMobile    = useIsMobile();
  const currentUser = JSON.parse(localStorage.getItem("shecare_user") || "{}");
  const username    = currentUser?.username || "You";

  const [feedTab,   setFeedTab]   = useState("community");
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cat,       setCat]       = useState("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(0);
  const [hasMore,   setHasMore]   = useState(true);
  const [feedError, setFeedError] = useState("");

  const [myPosts,   setMyPosts]   = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [myError,   setMyError]   = useState("");
  const [myLoaded,  setMyLoaded]  = useState(false);

  const [reposts,   setReposts]   = useState([]);
  const [rpLoading, setRpLoading] = useState(false);
  const [rpError,   setRpError]   = useState("");
  const [rpLoaded,  setRpLoaded]  = useState(false);

  const [bookmarks,    setBookmarks]    = useState([]);
  const [bmLoading,    setBmLoading]    = useState(false);
  const [bmError,      setBmError]      = useState("");
  const [bmLoaded,     setBmLoaded]     = useState(false);

  const [compose, setCompose] = useState(false);
  const [toast,   setToast]   = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const loadFeed = useCallback(async (category, pageNum, replace = false) => {
    setLoading(true); setFeedError("");
    try {
      const data = await getFeed(category === "all" ? undefined : category, undefined, pageNum);
      const normalised = data.map(p => ({
        ...p, tag: catToTag(p.category), avatar: "🌸",
        liked: false, saved: false, reposted: false,
        mediaUrl: p.mediaUrls?.[0] ?? null, mediaType: p.mediaType ?? null,
      }));
      setPosts(prev => replace ? normalised : [...prev, ...normalised]);
      setHasMore(data.length === 10);
    } catch { setFeedError("Could not load posts. Please check your connection."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { setPage(0); loadFeed(cat, 0, true); }, [cat, loadFeed]);

  const loadMyPosts = useCallback(async () => {
    setMyLoading(true); setMyError("");
    try {
      const data = await getMyPosts();
      setMyPosts(data.map(p => ({
        ...p, tag: catToTag(p.category), avatar: "🌸",
        liked: false, saved: false, reposted: false,
        mediaUrl: p.mediaUrls?.[0] ?? null, mediaType: p.mediaType ?? null,
      })));
      setMyLoaded(true);
    } catch { setMyError("Could not load your posts."); }
    finally { setMyLoading(false); }
  }, []);

  const loadReposts = useCallback(async () => {
    setRpLoading(true); setRpError("");
    try {
      const data = await getFeed(undefined, undefined, 0);
      const mine = data
        .filter(p => p.repostedByMe === true || p.reposted === true)
        .map(p => ({
          ...p, tag: catToTag(p.category), avatar: "🌸",
          liked: false, saved: false, reposted: true,
          mediaUrl: p.mediaUrls?.[0] ?? null, mediaType: p.mediaType ?? null,
        }));
      setReposts(mine);
      setRpLoaded(true);
    } catch { setRpError("Could not load reposts."); }
    finally { setRpLoading(false); }
  }, []);

  const loadBookmarks = useCallback(async () => {
    setBmLoading(true); setBmError("");
    try {
      const data = await getBookmarkedPosts();
      setBookmarks(data.map(p => ({
        ...p, tag: catToTag(p.category), avatar: "🌸",
        liked: false, saved: true, reposted: false,
        mediaUrl: p.mediaUrls?.[0] ?? null, mediaType: p.mediaType ?? null,
      })));
      setBmLoaded(true);
    } catch { setBmError("Could not load bookmarks."); }
    finally { setBmLoading(false); }
  }, []);

  useEffect(() => {
    if (feedTab === "my-posts"  && !myLoaded) loadMyPosts();
    if (feedTab === "reposts"   && !rpLoaded) loadReposts();
    if (feedTab === "bookmarks" && !bmLoaded) loadBookmarks();
  }, [feedTab, myLoaded, rpLoaded, bmLoaded, loadMyPosts, loadReposts, loadBookmarks]);

  const toggleInList = (setter, postId, field, countField) =>
    setter(prev => prev.map(p => p.id === postId
      ? { ...p, [field]: !p[field], [countField]: (p[countField] ?? 0) + (p[field] ? -1 : 1) }
      : p));

  const handleLikeToggle = postId => {
    toggleInList(setPosts,     postId, "liked", "likeCount");
    toggleInList(setMyPosts,   postId, "liked", "likeCount");
    toggleInList(setReposts,   postId, "liked", "likeCount");
    toggleInList(setBookmarks, postId, "liked", "likeCount");
  };

  const handleSaveToggle = postId => {
    setPosts(prev     => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    setMyPosts(prev   => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    setReposts(prev   => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    setBookmarks(prev => prev.filter(p => p.id !== postId));
    setBmLoaded(false);
  };

  const handleRepostToggle = postId => {
    toggleInList(setPosts,     postId, "reposted", "repostCount");
    toggleInList(setMyPosts,   postId, "reposted", "repostCount");
    toggleInList(setBookmarks, postId, "reposted", "repostCount");

    const alreadyInReposts = reposts.some(p => p.id === postId);
    if (alreadyInReposts) {
      setReposts(prev => prev.filter(p => p.id !== postId));
    } else {
      const source =
        posts.find(p => p.id === postId) ||
        myPosts.find(p => p.id === postId) ||
        bookmarks.find(p => p.id === postId);
      if (source) setReposts(prev => [{ ...source, reposted: true }, ...prev]);
    }
  };

  const handleDeleted = (postId) => {
    setPosts(prev     => prev.filter(p => p.id !== postId));
    setMyPosts(prev   => prev.filter(p => p.id !== postId));
    setReposts(prev   => prev.filter(p => p.id !== postId));
    setBookmarks(prev => prev.filter(p => p.id !== postId));
    showToast("Post deleted. 🗑️");
  };

  const handleEdited = (updated) => {
    const applyEdit = prev => prev.map(p => p.id === updated.id ? updated : p);
    setPosts(applyEdit);
    setMyPosts(applyEdit);
    setReposts(applyEdit);
    setBookmarks(applyEdit);
    showToast("Post updated! ✏️");
  };

  const handlePosted = (newPost) => {
    setPosts(prev   => [newPost, ...prev]);
    setMyPosts(prev => [newPost, ...prev]);
    setCompose(false);
    showToast("Your story has been shared! 🌸");
  };

  const visible = posts.filter(p =>
    search === "" ||
    (p.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.body ?? p.content ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const isOwnPost = (post) =>
    !post.anonymous && post.username && post.username === username;

  return (
    <AppShell current="community">
      <div style={{ padding: isMobile ? "16px 12px" : "32px 36px", maxWidth: 1100, width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>

        {toast && (
          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.secondary, color: C.white, borderRadius: 14, padding: "12px 24px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", whiteSpace: "nowrap" }}>
            {toast}
          </div>
        )}

        {compose && (
          <ComposeModal onClose={() => setCompose(false)} onPosted={handlePosted} username={username} />
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 16 : 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginBottom: 4 }}>Safe & Anonymous</p>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 26 : 34, fontWeight: 700, color: C.textDark, letterSpacing: "-0.5px" }}>Community Forum</h1>
          </div>
          <button onClick={() => setCompose(true)} style={{
            background: C.grad, color: C.white, border: "none", borderRadius: 14,
            padding: isMobile ? "10px 16px" : "13px 22px",
            fontFamily: "'Nunito', sans-serif", fontSize: isMobile ? 13 : 14, fontWeight: 700,
            cursor: "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ✏️ {isMobile ? "Post" : "Share Your Story"}
          </button>
        </div>

        {/* Feed Tab Switcher */}
        <div style={{
          display: "flex", background: C.bgLight,
          borderRadius: 16, padding: 4, marginBottom: isMobile ? 14 : 24,
          border: `1px solid ${C.border}`,
          width: isMobile ? "100%" : "fit-content",
          boxSizing: "border-box",
          overflowX: isMobile ? "auto" : "visible",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}>
          {FEED_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFeedTab(tab.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: isMobile ? "8px 10px" : "9px 20px", borderRadius: 12, border: "none",
              flex: isMobile ? 1 : "none",
              flexShrink: 0,
              background: feedTab === tab.id ? C.grad : "transparent",
              color: feedTab === tab.id ? C.white : C.textSoft,
              fontFamily: "'Nunito', sans-serif", fontSize: isMobile ? 10 : 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: feedTab === tab.id ? `0 2px 10px ${C.primaryGlow}` : "none",
              whiteSpace: "nowrap",
            }}>
              <span>{tab.icon}</span> {isMobile ? tab.label.split(" ")[0] : tab.label}
              {tab.id === "my-posts" && myLoaded && myPosts.length > 0 && (
                <span style={{ background: feedTab === "my-posts" ? "rgba(255,255,255,0.3)" : C.primary, color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                  {myPosts.length}
                </span>
              )}
              {tab.id === "reposts" && rpLoaded && reposts.length > 0 && (
                <span style={{ background: feedTab === "reposts" ? "rgba(255,255,255,0.3)" : C.primary, color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                  {reposts.length}
                </span>
              )}
              {tab.id === "bookmarks" && bmLoaded && bookmarks.length > 0 && (
                <span style={{ background: feedTab === "bookmarks" ? "rgba(255,255,255,0.3)" : C.primary, color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                  {bookmarks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isMobile && feedTab === "community" && (
          <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10, width: "100%", boxSizing: "border-box" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
                style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 14, padding: "10px 14px 10px 36px", fontFamily: "'Nunito', sans-serif", fontSize: 13, outline: "none", color: C.textDark, background: C.white, boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = C.primary}
                onBlur={e  => e.target.style.borderColor = C.border} />
            </div>
            <MobileCategoryScroller cat={cat} setCat={setCat} />
          </div>
        )}

        {!isMobile ? (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {feedTab === "community" && (
                <>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…"
                      style={{ width: "100%", border: `2px solid ${C.border}`, borderRadius: 14, padding: "11px 14px 11px 36px", fontFamily: "'Nunito', sans-serif", fontSize: 13, outline: "none", color: C.textDark, background: C.white, boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = C.primary}
                      onBlur={e  => e.target.style.borderColor = C.border} />
                  </div>
                  <div style={{ background: C.white, borderRadius: 20, padding: "18px", border: `1px solid ${C.border}` }}>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Categories</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {CATS.map(c => (
                        <button key={c.id} onClick={() => setCat(c.id)} style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: cat === c.id ? C.grad : "transparent",
                          color: cat === c.id ? C.white : C.textSoft,
                          fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
                          cursor: "pointer", transition: "all 0.2s",
                        }}>
                          <span>{c.icon}</span>{c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div style={{ background: C.bgLight, borderRadius: 18, padding: "16px 18px", border: `1px solid ${C.border}` }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: C.primaryDark, marginBottom: 8 }}>🛡️ Guidelines</p>
                {["Be kind & supportive", "Share experiences, not advice", "Posts can be anonymous or named", "Report harmful content"].map(g => (
                  <p key={g} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, marginBottom: 4 }}>• {g}</p>
                ))}
              </div>
            </div>

            <FeedContent
              feedTab={feedTab} visible={visible} loading={loading} hasMore={hasMore}
              page={page} setPage={setPage} loadFeed={loadFeed} cat={cat}
              feedError={feedError} myPosts={myPosts} myLoading={myLoading} myError={myError}
              setMyError={setMyError}
              reposts={reposts} rpLoading={rpLoading} rpError={rpError} setRpError={setRpError}
              bookmarks={bookmarks} bmLoading={bmLoading} bmError={bmError} setBmError={setBmError}
              handleLikeToggle={handleLikeToggle} handleSaveToggle={handleSaveToggle}
              handleRepostToggle={handleRepostToggle} handleDeleted={handleDeleted}
              handleEdited={handleEdited} showToast={showToast} username={username}
              setCompose={setCompose} isOwnPost={isOwnPost}
            />
          </div>
        ) : (
          <FeedContent
            feedTab={feedTab} visible={visible} loading={loading} hasMore={hasMore}
            page={page} setPage={setPage} loadFeed={loadFeed} cat={cat}
            feedError={feedError} myPosts={myPosts} myLoading={myLoading} myError={myError}
            setMyError={setMyError}
            reposts={reposts} rpLoading={rpLoading} rpError={rpError} setRpError={setRpError}
            bookmarks={bookmarks} bmLoading={bmLoading} bmError={bmError} setBmError={setBmError}
            handleLikeToggle={handleLikeToggle} handleSaveToggle={handleSaveToggle}
            handleRepostToggle={handleRepostToggle} handleDeleted={handleDeleted}
            handleEdited={handleEdited} showToast={showToast} username={username}
            setCompose={setCompose} isOwnPost={isOwnPost}
          />
        )}
      </div>
    </AppShell>
  );
}

// ─── Feed Content ─────────────────────────────────────────────────────────────
function FeedContent({
  feedTab, visible, loading, hasMore, page, setPage, loadFeed, cat,
  feedError, myPosts, myLoading, myError, setMyError,
  reposts, rpLoading, rpError, setRpError,
  bookmarks, bmLoading, bmError, setBmError,
  handleLikeToggle, handleSaveToggle, handleRepostToggle,
  handleDeleted, handleEdited, showToast, username, setCompose,
  isOwnPost,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", minWidth: 0 }}>

      {feedTab === "community" && (
        <>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>
            <strong style={{ color: C.textDark }}>{visible.length}</strong> posts
          </p>
          {feedError && <Banner type="error" message={feedError} />}
          {loading && visible.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 22, padding: "40px 20px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🌸</span>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Loading posts…</p>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 22, padding: "40px 20px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🌸</span>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark }}>No posts yet here</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginTop: 6 }}>Be the first to share your story!</p>
            </div>
          ) : (
            <>
              {visible.map(post => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle}
                  onRepostToggle={handleRepostToggle} onReportSuccess={msg => showToast(msg)}
                  onDeleted={handleDeleted} onEdited={handleEdited}
                  currentUsername={username}
                  isOwn={isOwnPost(post)}
                />
              ))}
              {hasMore && (
                <button onClick={() => { const next = page + 1; setPage(next); loadFeed(cat, next, false); }} disabled={loading}
                  style={{ border: `2px solid ${C.border}`, borderRadius: 14, padding: "13px", background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textMid, cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Loading…" : "Load more posts"}
                </button>
              )}
            </>
          )}
        </>
      )}

      {feedTab === "my-posts" && (
        <>
          {myError && <Banner type="error" message={myError} onClose={() => setMyError("")} />}
          {myLoading ? (
            <div style={{ background: C.white, borderRadius: 22, padding: "60px 40px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>✏️</span>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Loading your posts…</p>
            </div>
          ) : myPosts.length === 0 ? (
            <MyPostsEmpty onCompose={() => setCompose(true)} />
          ) : (
            <>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>
                <strong style={{ color: C.textDark }}>{myPosts.length}</strong> post{myPosts.length !== 1 ? "s" : ""} shared by you
              </p>
              {myPosts.map(post => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle}
                  onRepostToggle={handleRepostToggle} onReportSuccess={msg => showToast(msg)}
                  onDeleted={handleDeleted} onEdited={handleEdited}
                  currentUsername={username} isOwn={true} />
              ))}
            </>
          )}
        </>
      )}

      {feedTab === "reposts" && (
        <>
          {rpError && <Banner type="error" message={rpError} onClose={() => setRpError("")} />}
          {rpLoading ? (
            <div style={{ background: C.white, borderRadius: 22, padding: "60px 40px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🔁</span>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Loading reposts…</p>
            </div>
          ) : reposts.length === 0 ? (
            <RepostsEmpty />
          ) : (
            <>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>
                <strong style={{ color: C.textDark }}>{reposts.length}</strong> post{reposts.length !== 1 ? "s" : ""} reposted by you
              </p>
              {reposts.map(post => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle}
                  onRepostToggle={handleRepostToggle} onReportSuccess={msg => showToast(msg)}
                  onDeleted={handleDeleted} onEdited={handleEdited}
                  currentUsername={username} isRepost={true} />
              ))}
            </>
          )}
        </>
      )}

      {feedTab === "bookmarks" && (
        <>
          {bmError && <Banner type="error" message={bmError} onClose={() => setBmError("")} />}
          {bmLoading ? (
            <div style={{ background: C.white, borderRadius: 22, padding: "60px 40px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🔖</span>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Loading bookmarks…</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <BookmarksEmpty />
          ) : (
            <>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>
                <strong style={{ color: C.textDark }}>{bookmarks.length}</strong> saved post{bookmarks.length !== 1 ? "s" : ""}
              </p>
              {bookmarks.map(post => (
                <PostCard key={post.id} post={post}
                  onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle}
                  onRepostToggle={handleRepostToggle} onReportSuccess={msg => showToast(msg)}
                  onDeleted={handleDeleted} onEdited={handleEdited}
                  currentUsername={username} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}