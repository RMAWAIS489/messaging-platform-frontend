import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchMessages, setHighlightedMessage } from "../../features/messages/messageSlice";
import { emitMessageRead } from "../../services/socket";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import MessageInput from "./MessageInput";
import Avatar from "../ui/Avatar";
import { formatLastSeen } from "../../utils/formatTime";
import type { Conversation } from "../../types";
import { colors } from "../../styles";

export default function ChatWindow({ conversation, onBack }: { conversation: Conversation; onBack?: () => void }) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const messages = useAppSelector((s) => s.messages.messagesByConversation[conversation.id] || []);
  const typingUserIds = useAppSelector((s) => s.messages.typingUsers[conversation.id] || []);
  const pagination = useAppSelector((s) => s.messages.pagination[conversation.id]);
  const loading = useAppSelector((s) => s.messages.loading);
  const highlightedMessageId = useAppSelector((s) => s.messages.highlightedMessageId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevConvId = useRef<string>("");

  const other = conversation.type === "direct"
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const displayName = conversation.type === "group" ? conversation.name : other?.username;

  const typingNames = typingUserIds
    .map((id) => conversation.participants.find((p) => p.id === id)?.username || "")
    .filter(Boolean);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (prevConvId.current !== conversation.id) {
      prevConvId.current = conversation.id;
      dispatch(fetchMessages({ conversationId: conversation.id, page: 1 }));
    }
  }, [conversation.id, dispatch]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark last message as read
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.senderId !== currentUser?.id && last.status !== "read") {
      emitMessageRead(last.id, conversation.id);
    }
  }, [messages.length, currentUser?.id, conversation.id]);

  // Scroll to and highlight a specific message (from notification click)
  useEffect(() => {
    if (!highlightedMessageId) return;
    // Give the DOM a tick to render the messages
    const timer = setTimeout(() => {
      const el = document.getElementById(`msg-${highlightedMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Clear highlight after 3 s
      const clearTimer = setTimeout(() => {
        dispatch(setHighlightedMessage(null));
      }, 3000);
      return () => clearTimeout(clearTimer);
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightedMessageId, dispatch]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || loading) return;
    if (el.scrollTop === 0 && pagination && pagination.page < pagination.pages) {
      dispatch(fetchMessages({ conversationId: conversation.id, page: pagination.page + 1 }));
    }
  }, [loading, pagination, conversation.id, dispatch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: colors.bgChat }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 16px",
        background: colors.bgPanel,
        borderBottom: `1px solid ${colors.border}`,
        height: 60, flexShrink: 0,
      }}>
        {/* Back button — mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: colors.textMuted, display: "flex", alignItems: "center",
              padding: "4px 4px 4px 0", flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
        )}
        {conversation.type === "group" ? (
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: colors.bgInput,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={colors.textMuted}>
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
        ) : (
          <Avatar username={other?.username || "?"} avatar={other?.avatar || null} isOnline={conversation.otherUserOnline} size="md" />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{displayName}</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            {conversation.type === "group"
              ? `${conversation.participants.length} members`
              : conversation.otherUserOnline
              ? <span style={{ color: colors.primary }}>online</span>
              : other ? `last seen ${formatLastSeen(other.lastReadAt)}` : "offline"}
          </div>
        </div>

        {/* Header actions */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            <svg key="search" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>,
            <svg key="more" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>,
          ].map((icon, i) => (
            <button key={i} style={{
              background: "none", border: "none", color: colors.textMuted,
              cursor: "pointer", padding: 8, borderRadius: "50%",
              display: "flex", alignItems: "center",
            }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: "auto",
          padding: "12px 6%",
          display: "flex", flexDirection: "column",
          // Subtle light pattern — warm dots on the off-white chat bg
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b89a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {loading && messages.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <svg className="spin" width={28} height={28} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth="3" opacity={0.3}/>
              <path fill={colors.primary} d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <div style={{
              background: "rgba(0,0,0,0.06)", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, color: colors.textMuted,
            }}>
              No messages yet. Say hello! 👋
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showAvatar = !next || next.senderId !== msg.senderId;
          const isFirst = !prev || prev.senderId !== msg.senderId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
              isFirst={isFirst}
              isHighlighted={msg.id === highlightedMessageId}
            />
          );
        })}

        <TypingIndicator usernames={typingNames} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput conversationId={conversation.id} />
    </div>
  );
}
