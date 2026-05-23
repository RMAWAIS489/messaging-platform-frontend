import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import type { Status, StatusGroup } from "../../types";

interface StatusState {
  groups: StatusGroup[];
  loading: boolean;
  posting: boolean;
}

const initialState: StatusState = {
  groups: [],
  loading: false,
  posting: false,
};

export const fetchStatuses = createAsyncThunk(
  "status/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/statuses");
      return res.data.data as StatusGroup[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to load statuses");
    }
  }
);

export const postStatus = createAsyncThunk(
  "status/post",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await api.post("/statuses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data as Status;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to post status");
    }
  }
);

export const deleteStatus = createAsyncThunk(
  "status/delete",
  async (statusId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/statuses/${statusId}`);
      return statusId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete status");
    }
  }
);

const statusSlice = createSlice({
  name: "status",
  initialState,
  reducers: {
    addIncomingStatus(state, action: PayloadAction<Status>) {
      const s = action.payload;
      const group = state.groups.find((g) => g.user.id === s.userId);
      if (group) {
        group.statuses.unshift(s);
      } else {
        state.groups.push({ user: s.user, statuses: [s] });
      }
    },
    removeStatus(state, action: PayloadAction<{ statusId: string; userId: string }>) {
      const { statusId, userId } = action.payload;
      const group = state.groups.find((g) => g.user.id === userId);
      if (group) {
        group.statuses = group.statuses.filter((s) => s.id !== statusId);
        if (group.statuses.length === 0) {
          state.groups = state.groups.filter((g) => g.user.id !== userId);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStatuses.pending, (state) => { state.loading = true; });
    builder.addCase(fetchStatuses.fulfilled, (state, action) => {
      state.loading = false;
      state.groups = action.payload;
    });
    builder.addCase(fetchStatuses.rejected, (state) => { state.loading = false; });

    builder.addCase(postStatus.pending, (state) => { state.posting = true; });
    builder.addCase(postStatus.fulfilled, (state, action) => {
      state.posting = false;
      const s = action.payload;
      const group = state.groups.find((g) => g.user.id === s.userId);
      if (group) {
        group.statuses.unshift(s);
      } else {
        state.groups.unshift({ user: s.user, statuses: [s] });
      }
    });
    builder.addCase(postStatus.rejected, (state) => { state.posting = false; });

    builder.addCase(deleteStatus.fulfilled, (state, action) => {
      const statusId = action.payload;
      for (const group of state.groups) {
        group.statuses = group.statuses.filter((s) => s.id !== statusId);
      }
      state.groups = state.groups.filter((g) => g.statuses.length > 0);
    });
  },
});

export const { addIncomingStatus, removeStatus } = statusSlice.actions;
export default statusSlice.reducer;
