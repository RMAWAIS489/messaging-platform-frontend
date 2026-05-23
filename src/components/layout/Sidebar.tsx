import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setActiveConversation } from "../../features/conversations/conversationSlice";
import { logout } from "../../features/auth/authSlice";
import { disconnectSocket } from "../../services/socket";
import ConversationItem from "../conversations/ConversationItem";
import NewChatModal from "../conversations/NewChatModal";
import NotificationPanel from "../notifications/NotificationPanel";
import StatusBar from "../status/StatusBar";
import ProfilePanel from "../profile/ProfilePanel";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import { colors, radius, shadow } from "../../styles";
import { getAvatarUrl } from "../../utils/fileHelpers";
import { LogOut, Bell, MessageSquarePlus } from "lucide-react";

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { conversations, activeConversationId, loading } = useAppSelector((s) => s.conversations);
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount);
  const isMobile = useIsMobile();

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const name =
      c.type === "group"
        ? c.name
        : c.participants.find((p) => p.id !== currentUser?.id)?.username;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: isMobile ? "100%" : 360,
        minWidth: isMobile ? "100%" : 360,
        maxWidth: isMobile ? "100%" : 360,
        height: "100%",
        background: colors.bgPanel,
        borderRight: isMobile ? "none" : `1px solid ${colors.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: colors.bgPanel,
          borderBottom: `1px solid ${colors.border}`,
          height: 60,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>
          Chats
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <IconBtn
              onClick={() => setNotifOpen((v) => !v)}
              title="Notifications"
              active={notifOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colors.primary,
                    border: `1.5px solid ${colors.bgPanel}`,
                  }}
                />
              )}
            </IconBtn>
          </div>

          {/* New chat */}
          <IconBtn onClick={() => setNewChatOpen(true)} title="New chat">
            <MessageSquarePlus size={20} />
          </IconBtn>
        </div>
      </div>

      {/* ── Status bar (stories) ─────────────────────────────────────────── */}
      <StatusBar />

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "8px 12px", background: colors.bgPanel, flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={colors.textDim}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: colors.bgInput,
              border: "none",
              borderRadius: radius.full,
              padding: "8px 14px 8px 34px",
              fontSize: 14,
              color: colors.text,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* ── Conversations list ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          // Skeleton loader
          <div>
            {Array.from({ length: 7 }).map((_, i) => (
              <ConversationSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              gap: 10,
              color: colors.textDim,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              opacity={0.3}
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            <span style={{ fontSize: 14 }}>No conversations yet</span>
            <button
              onClick={() => setNewChatOpen(true)}
              style={{
                background: colors.primary,
                color: "#fff",
                border: "none",
                borderRadius: radius.full,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Start a chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => dispatch(setActiveConversation(conv.id))}
            />
          ))
        )}
      </div>

      {/* ── Bottom profile bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.bgCard,
          flexShrink: 0,
          gap: 10,
        }}
      >
        {/* Avatar + name — click to open profile */}
        <button
          onClick={() => setProfileOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            flex: 1,
            minWidth: 0,
            padding: "4px 6px",
            borderRadius: radius.lg,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              colors.bgInput)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "none")
          }
          title="Edit profile"
        >
          {/* Avatar with online ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={getAvatarUrl(
                currentUser?.avatar ?? null,
                currentUser?.username ?? ""
              )}
              alt={currentUser?.username}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${colors.primary}`,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: colors.primary,
                border: `2px solid ${colors.bgCard}`,
              }}
            />
          </div>

          {/* Name + email */}
          <div style={{ minWidth: 0, textAlign: "left" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentUser?.username}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.textDim,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentUser?.bio || currentUser?.email}
            </div>
          </div>
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Log out"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.textMuted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = colors.dangerLight;
            b.style.color = colors.danger;
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "none";
            b.style.color = colors.textMuted;
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* ── Profile panel (slides over sidebar) ─────────────────────────── */}
      <ProfilePanel
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <NewChatModal isOpen={newChatOpen} onClose={() => setNewChatOpen(false)} />

      {/* ── Notification panel (drops from top bar, full sidebar width) ── */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:
          active || hovered ? colors.bgInput : "transparent",
        border: "none",
        borderRadius: "50%",
        width: 38,
        height: 38,
        color: active ? colors.primary : hovered ? colors.text : colors.textMuted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Avatar circle */}
      <div
        className="skeleton"
        style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }}
      />

      {/* Text lines */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          className="skeleton"
          style={{ height: 13, borderRadius: 6, width: "55%" }}
        />
        <div
          className="skeleton"
          style={{ height: 11, borderRadius: 6, width: "80%" }}
        />
      </div>

      {/* Timestamp + badge placeholder */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: 32 }} />
        <div className="skeleton" style={{ height: 18, borderRadius: 9, width: 18 }} />
      </div>
    </div>
  );
}
