import { useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { sendMessage } from "../../features/messages/messageSlice";
import { updateLastMessage } from "../../features/conversations/conversationSlice";
import { emitTypingStart, emitTypingStop } from "../../services/socket";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { colors, radius } from "../../styles";
import toast from "react-hot-toast";

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const dispatch = useAppDispatch();
  const { sendingMessage } = useAppSelector((s) => s.messages);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const voice = useVoiceRecorder();

  const handleTyping = (value: string) => {
    setText(value);
    if (!isTyping.current) { isTyping.current = true; emitTypingStart(conversationId); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      emitTypingStop(conversationId);
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setFile(f);
    setFilePreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const clearFile = () => {
    setFile(null); setFilePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() && !file) return;
    if (isTyping.current) {
      isTyping.current = false;
      emitTypingStop(conversationId);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    }
    const formData = new FormData();
    if (text.trim()) formData.append("content", text.trim());
    if (file) formData.append("file", file);
    formData.append("type", file ? (file.type.startsWith("image/") ? "image" : "file") : "text");
    setText(""); clearFile();
    const result = await dispatch(sendMessage({ conversationId, formData }));
    if (sendMessage.fulfilled.match(result)) {
      dispatch(updateLastMessage(result.payload));
    } else {
      toast.error("Failed to send");
    }
  }, [text, file, conversationId, dispatch]);

  const handleSendVoice = useCallback(async () => {
    if (!voice.audioBlob) return;
    const ext = voice.audioBlob.type.includes("ogg") ? ".ogg" : ".webm";
    const audioFile = new File([voice.audioBlob], `voice${ext}`, { type: voice.audioBlob.type });
    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("type", "audio");
    voice.reset();
    const result = await dispatch(sendMessage({ conversationId, formData }));
    if (sendMessage.fulfilled.match(result)) {
      dispatch(updateLastMessage(result.payload));
    } else {
      toast.error("Failed to send voice message");
    }
  }, [voice, conversationId, dispatch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canSend = (text.trim().length > 0 || file !== null) && !sendingMessage;
  const isRecording = voice.state === "recording";
  const isRecorded = voice.state === "recorded";

  // ── Recording UI ──────────────────────────────────────────────────────────
  if (isRecording) {
    return (
      <div style={{ background: colors.bgPanel, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
          {/* Cancel */}
          <button
            onClick={voice.cancelRecording}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: colors.danger, display: "flex", flexShrink: 0, padding: 6,
            }}
            title="Cancel"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Pulsing red dot + timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: colors.danger,
              display: "inline-block",
              animation: "pulse-rec 1s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: colors.danger, fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(voice.duration)}
            </span>

            {/* Waveform bars */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="bounce-dot"
                  style={{
                    width: 3,
                    borderRadius: 2,
                    background: colors.primary,
                    height: `${8 + Math.sin(i * 0.8) * 6 + Math.random() * 4}px`,
                    animationDelay: `${(i % 5) * 0.12}s`,
                    opacity: 0.7 + (i % 3) * 0.1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stop & send */}
          <button
            onClick={voice.stopRecording}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: colors.primary, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}
            title="Stop and send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Recorded preview UI ───────────────────────────────────────────────────
  if (isRecorded && voice.audioUrl) {
    return (
      <div style={{ background: colors.bgPanel, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px" }}>
          {/* Discard */}
          <button
            onClick={voice.reset}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: colors.danger, display: "flex", flexShrink: 0, padding: 6,
            }}
            title="Discard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>

          {/* Mini audio player */}
          <audio
            src={voice.audioUrl}
            controls
            style={{ flex: 1, height: 36, minWidth: 0 }}
          />

          {/* Send */}
          <button
            onClick={handleSendVoice}
            disabled={sendingMessage}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: colors.primary, border: "none",
              cursor: sendingMessage ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", opacity: sendingMessage ? 0.6 : 1,
            }}
            title="Send voice message"
          >
            {sendingMessage ? (
              <svg className="spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity={0.3}/>
                <path fill="white" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Normal input UI ───────────────────────────────────────────────────────
  return (
    <div style={{ background: colors.bgPanel, borderTop: `1px solid ${colors.border}` }}>
      {/* File preview bar */}
      {file && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 16px",
          background: colors.bgInput,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          {filePreview
            ? <img src={filePreview} alt="preview" style={{ width: 44, height: 44, borderRadius: radius.md, objectFit: "cover" }} />
            : <div style={{ width: 44, height: 44, borderRadius: radius.md, background: colors.bgPanel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📎</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div style={{ fontSize: 11, color: colors.textDim }}>{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={clearFile} style={{ background: "none", border: "none", color: colors.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "8px 12px" }}>
        {/* Attach */}
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: "none", border: "none", color: colors.textMuted,
            cursor: "pointer", padding: 8, borderRadius: "50%",
            display: "flex", flexShrink: 0,
          }}
          title="Attach file"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFileChange} />

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          style={{
            flex: 1,
            background: colors.bgInput,
            border: "none",
            borderRadius: radius.xxl,
            padding: "10px 16px",
            fontSize: 15, color: colors.text,
            outline: "none", resize: "none",
            maxHeight: 120, overflowY: "auto",
            lineHeight: 1.5,
          }}
        />

        {/* Send button (when text/file) or Mic button (when empty) */}
        {canSend ? (
          <button
            onClick={handleSend}
            disabled={sendingMessage}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: colors.primary, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", transition: "opacity 0.15s",
            }}
            title="Send"
          >
            {sendingMessage ? (
              <svg className="spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity={0.3}/>
                <path fill="white" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={voice.startRecording}
            style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: colors.primary, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", transition: "transform 0.1s, background 0.15s",
            }}
            title="Record voice message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
