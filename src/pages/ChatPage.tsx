import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchConversations, setActiveConversation } from "../features/conversations/conversationSlice";
import { fetchNotifications } from "../features/notifications/notificationSlice";
import { connectSocket } from "../services/socket";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import { useIsMobile } from "../hooks/useIsMobile";
import { colors } from "../styles";

export default function ChatPage() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { conversations, activeConversationId } = useAppSelector((s) => s.conversations);
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isMobile = useIsMobile();

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  // On mobile: show sidebar when no chat selected, show chat when one is selected
  const showSidebar = !isMobile || !activeConversationId;
  const showChat = !isMobile || !!activeConversationId;

  return (
    <div style={{ display: "flex", height: "100dvh", background: colors.bg, overflow: "hidden" }}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar />
      )}

      {/* Chat area */}
      {showChat && (
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={isMobile ? () => dispatch(setActiveConversation(null)) : undefined}
            />
          ) : (
            // Empty state — only shown on desktop (mobile shows sidebar instead)
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: colors.bgChat, gap: 16,
            }}>
              <div style={{
                width: 200, height: 200, borderRadius: "50%",
                background: "rgba(0,168,132,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="100" height="100" viewBox="0 0 24 24" fill={colors.primary} opacity={0.3}>
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: 22, fontWeight: 300, color: colors.text, marginBottom: 8 }}>
                  Select a chat
                </h2>
                <p style={{ fontSize: 14, color: colors.textMuted, maxWidth: 320, lineHeight: 1.6 }}>
                  Choose a conversation from the left to start messaging, or start a new one.
                </p>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px",
                border: `1px solid ${colors.border}`,
                borderRadius: 4, marginTop: 16,
                background: colors.bgPanel,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={colors.textDim}>
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <span style={{ fontSize: 13, color: colors.textDim }}>
                  End-to-end encrypted
                </span>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
