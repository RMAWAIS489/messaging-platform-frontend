import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import type { Notification } from "../../types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/notifications");
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notifications/read-all");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.pending, (state) => { state.loading = true; });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    });
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    });
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => (n.isRead = true));
      state.unreadCount = 0;
    });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
