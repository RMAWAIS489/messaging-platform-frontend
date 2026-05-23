import { useState } from "react";
import type { Conversation } from "../../types";
import Avatar from "../ui/Avatar";
import { formatConversationTime } from "../../utils/formatTime";
import { useAppSelector } from "../../app/hooks";
import { colors } from "../../styles";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({ conversation, isActive, onClick }: Props) {
  const currentUser = useAppSelector((s) => s.auth.user);
  const [hovered, setHovered] = useState(false);

  const other = conversation.type === "direct"
    ? conversation.participants.find((p) => p.id !== currentUser?.id)
    : null;

  const displayName = conversation.type === "group" ? conversation.name : other?.username || "Unknown";
  const displayAvatar = conversation.type === "group" ? conversation.avatar : other?.avatar || null;
  const isOnline = conversation.type === "direct" ? conversation.otherUserOnline : false;

  const lastMsg = conversation.lastMessage;
  const preview = lastMsg
    ? lastMsg.isDeleted ? "🚫 This message was deleted"
    : lastMsg.type === "image" ? "📷 Photo"
    : lastMsg.type === "file" ? "📎 File"
    : lastMsg.type === "audio" ? "🎵 Audio"
    : lastMsg.content || ""
    : "";

  const isFromMe = lastMsg?.senderId === currentUser?.id;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 16px",
        background: isActive ? colors.bgActive : hovered ? colors.bgHover : "transparent",
        cursor: "pointer",
        borderBottom: `1px solid ${colors.border}`,
        transition: "background 0.1s",
      }}
    >
      {/* Avatar */}
      {conversation.type === "group" ? (
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: colors.bgActive,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={colors.textMuted}>
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </div>
      ) : (
        <Avatar username={displayName || "?"} avatar={displayAvatar} isOnline={isOnline} size="md" />
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={{ fontSize: 11, color: (conversation.unreadCount || 0) > 0 ? colors.primary : colors.textDim, flexShrink: 0, marginLeft: 8 }}>
            {lastMsg ? formatConversationTime(lastMsg.createdAt) : ""}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 13, color: colors.textMuted,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {isFromMe && <span style={{ color: colors.textDim }}>You: </span>}
            {preview}
          </span>
          {(conversation.unreadCount || 0) > 0 && (
            <span style={{
              background: colors.primary, color: "#fff",
              fontSize: 11, fontWeight: 700,
              minWidth: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 5px", flexShrink: 0, marginLeft: 8,
            }}>
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
