import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import type { Message, PaginationMeta } from "../../types";

interface MessageState {
  messagesByConversation: Record<string, Message[]>;
  pagination: Record<string, PaginationMeta>;
  searchResults: Message[];
  searchQuery: string;
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  highlightedMessageId: string | null;
}

const initialState: MessageState = {
  messagesByConversation: {},
  pagination: {},
  searchResults: [],
  searchQuery: "",
  loading: false,
  sendingMessage: false,
  error: null,
  typingUsers: {},
  highlightedMessageId: null,
};

export const fetchMessages = createAsyncThunk(
  "messages/fetch",
  async ({ conversationId, page = 1 }: { conversationId: string; page?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}/messages?page=${page}&limit=50`);
      return { conversationId, ...res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load messages");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "messages/send",
  async (
    { conversationId, formData }: { conversationId: string; formData: FormData },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as Message;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to send message");
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "messages/delete",
  async ({ messageId, conversationId }: { messageId: string; conversationId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/messages/${messageId}`);
      return { messageId, conversationId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete message");
    }
  }
);

export const editMessage = createAsyncThunk(
  "messages/edit",
  async ({ messageId, content }: { messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/messages/${messageId}`, { content });
      return res.data.data as Message;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to edit message");
    }
  }
);

export const searchMessages = createAsyncThunk(
  "messages/search",
  async ({ q, conversationId }: { q: string; conversationId?: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ q });
      if (conversationId) params.append("conversationId", conversationId);
      const res = await api.get(`/messages/search?${params}`);
      return { results: res.data.data as Message[], query: q };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Search failed");
    }
  }
);

const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      const { conversationId } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      const exists = state.messagesByConversation[conversationId].find(
        (m) => m.id === action.payload.id
      );
      if (!exists) {
        state.messagesByConversation[conversationId].push(action.payload);
      }
    },
    updateMessageStatus(
      state,
      action: PayloadAction<{ messageId: string; conversationId: string; status: Message["status"] }>
    ) {
      const { messageId, conversationId, status } = action.payload;
      const msgs = state.messagesByConversation[conversationId];
      if (msgs) {
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) msg.status = status;
      }
    },
    setTyping(state, action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>) {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = [];
      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId);
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          (id) => id !== userId
        );
      }
    },
    clearSearch(state) {
      state.searchResults = [];
      state.searchQuery = "";
    },
    setHighlightedMessage(state, action: PayloadAction<string | null>) {
      state.highlightedMessageId = action.payload;
    },
    softDeleteMessage(state, action: PayloadAction<{ messageId: string; conversationId: string }>) {
      const { messageId, conversationId } = action.payload;
      const msgs = state.messagesByConversation[conversationId];
      if (msgs) {
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) { msg.isDeleted = true; msg.content = null; }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.pending, (state) => { state.loading = true; });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.loading = false;
      const { conversationId, messages, pagination } = action.payload;
      if (pagination.page === 1) {
        state.messagesByConversation[conversationId] = messages;
      } else {
        // Prepend older messages
        state.messagesByConversation[conversationId] = [
          ...messages,
          ...(state.messagesByConversation[conversationId] || []),
        ];
      }
      state.pagination[conversationId] = pagination;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(sendMessage.pending, (state) => { state.sendingMessage = true; });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sendingMessage = false;
      const msg = action.payload;
      if (!state.messagesByConversation[msg.conversationId]) {
        state.messagesByConversation[msg.conversationId] = [];
      }
      const exists = state.messagesByConversation[msg.conversationId].find((m) => m.id === msg.id);
      if (!exists) state.messagesByConversation[msg.conversationId].push(msg);
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.sendingMessage = false;
      state.error = action.payload as string;
    });
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const { messageId, conversationId } = action.payload;
      const msgs = state.messagesByConversation[conversationId];
      if (msgs) {
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) { msg.isDeleted = true; msg.content = null; }
      }
    });
    builder.addCase(editMessage.fulfilled, (state, action) => {
      const updated = action.payload;
      const msgs = state.messagesByConversation[updated.conversationId];
      if (msgs) {
        const idx = msgs.findIndex((m) => m.id === updated.id);
        if (idx !== -1) msgs[idx] = { ...msgs[idx], ...updated };
      }
    });
    builder.addCase(searchMessages.fulfilled, (state, action) => {
      state.searchResults = action.payload.results;
      state.searchQuery = action.payload.query;
    });
  },
});

export const { addMessage, updateMessageStatus, setTyping, clearSearch, softDeleteMessage, setHighlightedMessage } =
  messageSlice.actions;
export default messageSlice.reducer;
