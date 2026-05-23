import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../features/notifications/notificationSlice";
import { setActiveConversation } from "../../features/conversations/conversationSlice";
import { setHighlightedMessage } from "../../features/messages/messageSlice";
import { CheckCheck, MessageSquare, Users, AtSign, Bell } from "lucide-react";
import { colors, radius, shadow } from "../../styles";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import type { Notification } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Initials avatar for notifications (matches Avatar component style)
function NotifAvatar({
  username,
  avatar,
  size = 38,
}: {
  username: string;
  avatar: string | null;
  size?: number;
}) {
  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Deterministic color from username
  const palette = [
    "#7c3aed", "#2563eb", "#0891b2", "#059669",
    "#d97706", "#dc2626", "#db2777", "#7c3aed",
  ];
  const color = palette[username.charCodeAt(0) % palette.length];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}

// Icon badge overlaid on avatar for notification type
function TypeBadge({ type }: { type: Notification["type"] }) {
  const iconMap = {
    new_message: <MessageSquare size={9} />,
    group_invite: <Users size={9} />,
    mention: <AtSign size={9} />,
  };
  const colorMap = {
    new_message: colors.primary,
    group_invite: "#7c3aed",
    mention: "#2563eb",
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: colorMap[type] ?? colors.primary,
        border: `2px solid ${colors.bgCard}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      {iconMap[type]}
    </div>
  );
}

function getNotificationTitle(n: Notification): string {
  if (n.type === "new_message") {
    const sender = n.sender?.username ?? "Someone";
    if (n.conversationName) return `${sender} in ${n.conversationName}`;
    return sender;
  }
  if (n.type === "group_invite") return "Group invitation";
  if (n.type === "mention") {
    const sender = n.sender?.username ?? "Someone";
    return `${sender} mentioned you`;
  }
  return "Notification";
}

function getNotificationBody(n: Notification): string {
  if (n.type === "new_message") return n.content ?? "Sent you a message";
  return n.content ?? "";
}

// Each row gets its own hook instance so timestamps tick independently
function NotificationRow({
  n,
  isLast,
  onClick,
}: {
  n: Notification;
  isLast: boolean;
  onClick: (n: Notification) => void;
}) {
  const relativeTime = useRelativeTime(n.createdAt);
  const title = getNotificationTitle(n);
  const body = getNotificationBody(n);
  const senderName = n.sender?.username ?? "Unknown";
  const senderAvatar = n.sender?.avatar ?? null;

  return (
    <button
      onClick={() => onClick(n)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${colors.border}`,
        background: n.isRead ? "transparent" : "rgba(0,168,132,0.07)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = n.isRead
          ? colors.bgHover
          : "rgba(0,168,132,0.13)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = n.isRead
          ? "transparent"
          : "rgba(0,168,132,0.07)";
      }}
    >
      {/* Avatar + type badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <NotifAvatar username={senderName} avatar={senderAvatar} size={40} />
        <TypeBadge type={n.type} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: n.isRead ? 500 : 700,
              color: colors.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {title}
          </span>
          {/* ← live-updating timestamp */}
          <span
            style={{
              fontSize: 11,
              color: colors.textDim,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {relativeTime}
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: colors.textMuted,
            lineHeight: 1.45,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {body}
        </p>
      </div>

      {/* Unread dot */}
      {!n.isRead && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colors.primary,
            flexShrink: 0,
            marginTop: 6,
          }}
        />
      )}
    </button>
  );
}

export default function NotificationPanel({ isOpen, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(
    (s) => s.notifications
  );
  const conversations = useAppSelector((s) => s.conversations.conversations);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) dispatch(fetchNotifications());
  }, [isOpen, dispatch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) dispatch(markNotificationRead(n.id));
    const conversationId = n.meta?.conversationId as string | undefined;
    const messageId = n.meta?.messageId as string | undefined;
    if (conversationId) {
      dispatch(setActiveConversation(conversationId));
      if (messageId) dispatch(setHighlightedMessage(messageId));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: 60,
        left: 0,
        right: 0,
        width: "100%",
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: `0 0 ${radius.xl} ${radius.xl}`,
        boxShadow: shadow.lg,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                background: colors.primary,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: radius.full,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => dispatch(markAllNotificationsRead())}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: colors.primary,
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: radius.md,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                colors.primaryLight)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "none")
            }
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div style={{ overflowY: "auto", flex: 1, maxHeight: 340 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              color: colors.textDim,
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              gap: 10,
              color: colors.textDim,
            }}
          >
            <Bell size={32} opacity={0.3} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              You're all caught up
            </span>
            <span style={{ fontSize: 12, textAlign: "center", opacity: 0.7 }}>
              New messages and mentions will appear here
            </span>
          </div>
        ) : (
          notifications.map((n, i) => (
            <NotificationRow
              key={n.id}
              n={n}
              isLast={i === notifications.length - 1}
              onClick={handleNotificationClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
