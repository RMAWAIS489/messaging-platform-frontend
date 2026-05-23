import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import type { Conversation, Message } from "../../types";

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  activeConversationId: null,
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  "conversations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/conversations");
      return res.data.data as Conversation[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load conversations");
    }
  }
);

export const createDirectConversation = createAsyncThunk(
  "conversations/createDirect",
  async (targetUserId: string, { rejectWithValue }) => {
    try {
      const res = await api.post("/conversations/direct", { targetUserId });
      return res.data.data as Conversation;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create conversation");
    }
  }
);

export const createGroupConversation = createAsyncThunk(
  "conversations/createGroup",
  async (data: { name: string; memberIds: string[] }, { rejectWithValue }) => {
    try {
      const res = await api.post("/conversations/group", data);
      return res.data.data as Conversation;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to create group");
    }
  }
);

const conversationSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      // Clear unread count when opening
      if (action.payload) {
        const conv = state.conversations.find((c) => c.id === action.payload);
        if (conv) conv.unreadCount = 0;
      }
    },
    updateLastMessage(state, action: PayloadAction<Message>) {
      const msg = action.payload;
      const conv = state.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = msg;
        conv.updatedAt = msg.createdAt;
        // Increment unread if not active
        if (state.activeConversationId !== msg.conversationId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        // Bubble to top
        state.conversations = [
          conv,
          ...state.conversations.filter((c) => c.id !== msg.conversationId),
        ];
      }
    },
    setUserOnlineStatus(
      state,
      action: PayloadAction<{ userId: string; isOnline: boolean; lastSeen?: string }>
    ) {
      const { userId, isOnline, lastSeen } = action.payload;
      state.conversations.forEach((conv) => {
        if (conv.type === "direct") {
          const p = conv.participants.find((p) => p.id === userId);
          if (p) conv.otherUserOnline = isOnline;
        }
      });
    },
    addConversation(state, action: PayloadAction<Conversation>) {
      const exists = state.conversations.find((c) => c.id === action.payload.id);
      if (!exists) state.conversations.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchConversations.pending, (state) => { state.loading = true; });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.loading = false;
      state.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    builder.addCase(createDirectConversation.fulfilled, (state, action) => {
      const exists = state.conversations.find((c) => c.id === action.payload.id);
      if (!exists) state.conversations.unshift(action.payload);
      state.activeConversationId = action.payload.id;
    });
    builder.addCase(createGroupConversation.fulfilled, (state, action) => {
      state.conversations.unshift(action.payload);
      state.activeConversationId = action.payload.id;
    });
  },
});

export const {
  setActiveConversation,
  updateLastMessage,
  setUserOnlineStatus,
  addConversation,
} = conversationSlice.actions;
export default conversationSlice.reducer;
