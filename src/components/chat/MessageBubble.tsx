import { useState, useRef, useEffect } from "react";
import type { Message } from "../../types";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { deleteMessage, editMessage } from "../../features/messages/messageSlice";
import { formatMessageTime, formatFileSize } from "../../utils/formatTime";
import { getAvatarUrl, getMediaUrl } from "../../utils/fileHelpers";
import { colors, radius, shadow } from "../../styles";
import toast from "react-hot-toast";

interface Props {
  message: Message;
  showAvatar: boolean;
  isFirst: boolean;
  isHighlighted?: boolean;
}

export default function MessageBubble({ message, showAvatar, isFirst, isHighlighted = false }: Props) {
  const currentUser = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const isMine = message.senderId === currentUser?.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content ?? "");
  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Focus edit textarea when entering edit mode
  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      const len = editText.length;
      editRef.current?.setSelectionRange(len, len);
    }
  }, [editing]);

  const handleDelete = async () => {
    setMenuOpen(false);
    const result = await dispatch(deleteMessage({ messageId: message.id, conversationId: message.conversationId }));
    if (deleteMessage.rejected.match(result)) toast.error("Failed to delete");
  };

  const handleEditSave = async () => {
    if (!editText.trim() || editText.trim() === message.content) {
      setEditing(false);
      return;
    }
    const result = await dispatch(editMessage({ messageId: message.id, content: editText.trim() }));
    if (editMessage.fulfilled.match(result)) {
      setEditing(false);
    } else {
      toast.error("Failed to edit message");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === "Escape") { setEditing(false); setEditText(message.content ?? ""); }
  };

  // ── Deleted state ────────────────────────────────────────────────────────
  if (message.isDeleted) {
    return (
      <div style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        padding: "2px 16px",
        marginBottom: 2,
      }}>
        <div style={{
          background: isMine ? colors.bgMessageMine : colors.bgMessage,
          borderRadius: radius.lg,
          padding: "7px 12px",
          fontSize: 13,
          color: colors.textMuted,
          fontStyle: "italic",
          boxShadow: shadow.msg,
          border: `1px solid ${colors.border}`,
        }}>
          This message was deleted
        </div>
      </div>
    );
  }

  const tailMine: React.CSSProperties  = { borderRadius: "18px 18px 4px 18px" };
  const tailOther: React.CSSProperties = { borderRadius: "18px 18px 18px 4px" };
  const noTail: React.CSSProperties    = { borderRadius: "18px" };
  const bubbleShape = isFirst ? (isMine ? tailMine : tailOther) : noTail;

  return (
    <div
      id={`msg-${message.id}`}
      className="msg-in"
      style={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 6,
        padding: `${isFirst ? 4 : 1}px 16px`,
        transition: "background 0.4s ease",
        background: isHighlighted ? "rgba(0,168,132,0.15)" : "transparent",
        borderRadius: 8,
      }}
    >
      {/* Avatar — other user only */}
      <div style={{ width: 28, flexShrink: 0, alignSelf: "flex-end", marginBottom: 2 }}>
        {!isMine && showAvatar && (
          <img
            src={getAvatarUrl(message.sender.avatar, message.sender.username)}
            alt={message.sender.username}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      {/* Column: sender name + bubble */}
      <div style={{
        maxWidth: "min(68%, 420px)",
        display: "flex",
        flexDirection: "column",
        alignItems: isMine ? "flex-end" : "flex-start",
      }}>
        {/* Sender name in groups */}
        {!isMine && isFirst && (
          <span style={{
            fontSize: 12, fontWeight: 700, color: colors.primary,
            marginBottom: 3, marginLeft: 12,
          }}>
            {message.sender.username}
          </span>
        )}

        {/* Bubble — 3-dot button lives inside here */}
        <div
          ref={menuRef}
          style={{
            background: isMine ? colors.bgMessageMine : colors.bgMessage,
            ...bubbleShape,
            padding: "8px 12px 6px",
            boxShadow: shadow.msg,
            border: `1px solid ${isMine ? "rgba(0,0,0,0.04)" : colors.border}`,
            position: "relative",
            wordBreak: "break-word",
          }}
        >
          {/* ── 3-dot button (top-right, inside bubble) ── */}
          {isMine && !editing && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                position: "absolute", top: 4, right: 4,
                width: 22, height: 22, borderRadius: "50%",
                background: menuOpen ? "rgba(0,0,0,0.12)" : "transparent",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.textDim,
                transition: "background 0.15s",
                zIndex: 2,
              }}
              title="Message options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="19" r="2"/>
              </svg>
            </button>
          )}

          {/* ── Dropdown menu ── */}
          {menuOpen && (
            <div style={{
              position: "absolute",
              top: 28, right: 4,
              background: colors.bgPanel,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.lg,
              boxShadow: shadow.lg,
              zIndex: 100,
              minWidth: 140,
              overflow: "hidden",
            }}>
              {message.type === "text" && (
                <button
                  onClick={() => { setMenuOpen(false); setEditing(true); setEditText(message.content ?? ""); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", border: "none", background: "transparent",
                    cursor: "pointer", fontSize: 13, color: colors.text, textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.bgHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={colors.textMuted}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 13, color: colors.danger, textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.dangerLight; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={colors.danger}>
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                Delete
              </button>
            </div>
          )}

          {/* ── Image ── */}
          {message.type === "image" && message.fileUrl && (
            <img
              src={getMediaUrl(message.fileUrl)}
              alt="photo"
              onClick={() => window.open(getMediaUrl(message.fileUrl!), "_blank")}
              style={{
                maxWidth: "min(280px, 55vw)", maxHeight: 280,
                borderRadius: 10, display: "block", cursor: "pointer",
                marginBottom: message.content ? 6 : 4,
              }}
            />
          )}

          {/* ── File ── */}
          {message.type === "file" && message.fileUrl && (
            <a
              href={getMediaUrl(message.fileUrl)}
              download={message.fileName}
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(0,0,0,0.05)", borderRadius: radius.md,
                padding: "8px 10px", marginBottom: message.content ? 6 : 4,
                textDecoration: "none",
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: radius.md, flexShrink: 0,
                background: isMine ? "rgba(0,0,0,0.08)" : colors.bgInput,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>
                📎
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                  {message.fileName}
                </div>
                {message.fileSize && (
                  <div style={{ fontSize: 11, color: colors.textDim }}>{formatFileSize(message.fileSize)}</div>
                )}
              </div>
            </a>
          )}

          {/* ── Audio ── */}
          {message.type === "audio" && message.fileUrl && (
            <VoiceMessagePlayer src={getMediaUrl(message.fileUrl)} isMine={isMine} />
          )}

          {/* ── Text (normal or edit mode) ── */}
          {editing ? (
            <div style={{ paddingTop: 4 }}>
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={2}
                style={{
                  width: "100%", background: "rgba(0,0,0,0.06)",
                  border: `1.5px solid ${colors.primary}`,
                  borderRadius: radius.md, padding: "6px 8px",
                  fontSize: 14, color: colors.text,
                  outline: "none", resize: "none",
                  fontFamily: "inherit", lineHeight: 1.5,
                  minWidth: 180,
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setEditing(false); setEditText(message.content ?? ""); }}
                  style={{
                    fontSize: 12, padding: "3px 10px", borderRadius: radius.full,
                    border: `1px solid ${colors.border}`, background: "transparent",
                    color: colors.textMuted, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  style={{
                    fontSize: 12, padding: "3px 10px", borderRadius: radius.full,
                    border: "none", background: colors.primary,
                    color: "#fff", cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            message.content && (
              <span style={{
                fontSize: 14.5, color: colors.text,
                lineHeight: 1.55, whiteSpace: "pre-wrap",
                display: "block",
                paddingRight: isMine ? 20 : 0, // space for 3-dot button
              }}>
                {message.content}
              </span>
            )
          )}

          {/* ── Time + ticks ── */}
          {!editing && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              gap: 3, marginTop: 4,
            }}>
              <span style={{ fontSize: 11, color: isMine ? colors.textTime : colors.textDim, whiteSpace: "nowrap" }}>
                {formatMessageTime(message.createdAt)}
              </span>
              {isMine && <ReadTicks status={message.status} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Read ticks ─────────────────────────────────────────────────────────────
function ReadTicks({ status }: { status: Message["status"] }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
      {status === "read" ? (
        <>
          <path d="M1 5.5L4.5 9L10 3" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5.5L8.5 9L14 3" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </>
      ) : status === "delivered" ? (
        <>
          <path d="M1 5.5L4.5 9L10 3" stroke={colors.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5.5L8.5 9L14 3" stroke={colors.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </>
      ) : (
        <path d="M3 5.5L6.5 9L13 3" stroke={colors.textDim} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

// ── Voice message player ───────────────────────────────────────────────────
function formatVoiceTime(secs: number): string {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function VoiceMessagePlayer({ src, isMine }: { src: string; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trackColor = "rgba(0,0,0,0.15)";
  const textColor = colors.textDim;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, maxWidth: 240 }}>
      <audio ref={audioRef} src={src} preload="metadata" style={{ display: "none" }} />
      <button
        onClick={togglePlay}
        style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: colors.primary, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
        }}
      >
        {playing
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ position: "relative", height: 18, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, background: trackColor }} />
          <div style={{
            position: "absolute", left: 0, height: 3, borderRadius: 2,
            background: colors.primary, width: `${progress}%`, transition: "width 0.1s linear",
          }} />
          <input
            type="range" min={0} max={duration || 0} step={0.01} value={currentTime}
            onChange={handleSeek}
            style={{ position: "absolute", left: 0, right: 0, width: "100%", opacity: 0, cursor: "pointer", height: 18, margin: 0 }}
          />
        </div>
        <span style={{ fontSize: 11, color: textColor }}>
          {playing || currentTime > 0 ? formatVoiceTime(currentTime) : formatVoiceTime(duration)}
        </span>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={textColor} style={{ flexShrink: 0 }}>
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    </div>
  );
}
