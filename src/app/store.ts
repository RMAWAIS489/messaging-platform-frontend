import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import conversationReducer from "../features/conversations/conversationSlice";
import messageReducer from "../features/messages/messageSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import userReducer from "../features/users/userSlice";
import statusReducer from "../features/status/statusSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationReducer,
    messages: messageReducer,
    notifications: notificationReducer,
    users: userReducer,
    status: statusReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
