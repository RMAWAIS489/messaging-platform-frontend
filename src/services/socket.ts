import { io, Socket } from "socket.io-client";
import { store } from "../app/store";
import { addMessage, updateMessageStatus, setTyping } from "../features/messages/messageSlice";
import { updateLastMessage, setUserOnlineStatus } from "../features/conversations/conversationSlice";
import { addNotification } from "../features/notifications/notificationSlice";
import { addIncomingStatus, removeStatus } from "../features/status/statusSlice";
import type { Message, Notification, Status } from "../types";

// Connect directly to backend — Socket.IO WebSocket doesn't go through Vite proxy reliably
const SOCKET_URL = "http://localhost:5000";

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  // If already connected with same token, reuse
  if (socket?.connected) {
    console.log("✅ Socket already connected");
    return socket;
  }

  // Disconnect stale socket if exists
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  console.log("🔌 Connecting socket to", SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("🔴 Socket connect error:", err.message);
  });

  // ── New message → add to Redux immediately ──────────────────────────────
  socket.on("message:new", (message: Message) => {
    console.log("📨 New message received:", message.id);
    store.dispatch(addMessage(message));
    store.dispatch(updateLastMessage(message));
  });

  // ── Read receipt ────────────────────────────────────────────────────────
  socket.on("message:read", (data: { messageId: string; conversationId: string }) => {
    store.dispatch(updateMessageStatus({ ...data, status: "read" }));
  });

  // ── Typing ──────────────────────────────────────────────────────────────
  socket.on("typing:start", (data: { userId: string; conversationId: string }) => {
    store.dispatch(setTyping({ ...data, isTyping: true }));
  });

  socket.on("typing:stop", (data: { userId: string; conversationId: string }) => {
    store.dispatch(setTyping({ ...data, isTyping: false }));
  });

  // ── Online / offline ────────────────────────────────────────────────────
  socket.on("user:online", (data: { userId: string }) => {
    store.dispatch(setUserOnlineStatus({ userId: data.userId, isOnline: true }));
  });

  socket.on("user:offline", (data: { userId: string; lastSeen: string }) => {
    store.dispatch(setUserOnlineStatus({ userId: data.userId, isOnline: false, lastSeen: data.lastSeen }));
  });

  // ── Notifications ───────────────────────────────────────────────────────
  socket.on("notification:new", (notification: Notification) => {
    store.dispatch(addNotification(notification));
  });

  // ── Statuses ─────────────────────────────────────────────────────────────
  socket.on("status:new", (status: Status) => {
    store.dispatch(addIncomingStatus(status));
  });

  socket.on("status:deleted", (data: { statusId: string; userId: string }) => {
    store.dispatch(removeStatus(data));
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null { return socket; }

export const emitTypingStart = (conversationId: string) =>
  socket?.emit("typing:start", { conversationId });

export const emitTypingStop = (conversationId: string) =>
  socket?.emit("typing:stop", { conversationId });

export const emitMessageRead = (messageId: string, conversationId: string) =>
  socket?.emit("message:read", { messageId, conversationId });

export const emitJoinConversation = (conversationId: string) =>
  socket?.emit("conversation:join", { conversationId });
