export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: "text" | "image" | "file" | "audio" | "video";
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyToId: string | null;
  isDeleted: boolean;
  status: "sent" | "delivered" | "read";
  createdAt: string;
  updatedAt: string;
  sender: User;
}

export interface Participant {
  id: string;
  username: string;
  avatar: string | null;
  role: "member" | "admin";
  lastReadAt: string | null;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string | null;
  avatar: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  otherUserOnline?: boolean;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: "new_message" | "group_invite" | "mention";
  content: string;
  meta: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; username: string; avatar: string | null } | null;
  conversationName: string | null;
}

export interface Status {
  id: string;
  userId: string;
  caption: string | null;
  mediaUrl: string | null;
  type: "text" | "image";
  backgroundColor: string | null;
  createdAt: string;
  user: Pick<User, "id" | "username" | "avatar">;
}

export interface StatusGroup {
  user: Pick<User, "id" | "username" | "avatar">;
  statuses: Status[];
}

export interface TypingUser {
  userId: string;
  conversationId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
