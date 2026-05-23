import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import type { User } from "../../types";

interface UserState {
  searchResults: User[];
  searchLoading: boolean;
  selectedUser: User | null;
}

const initialState: UserState = {
  searchResults: [],
  searchLoading: false,
  selectedUser: null,
};

export const searchUsers = createAsyncThunk(
  "users/search",
  async (q: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      return res.data.data as User[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/users/${id}`);
      return res.data.data as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSearch(state) {
      state.searchResults = [];
    },
    setSelectedUser(state, action: PayloadAction<User | null>) {
      state.selectedUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(searchUsers.pending, (state) => { state.searchLoading = true; });
    builder.addCase(searchUsers.fulfilled, (state, action) => {
      state.searchLoading = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchUsers.rejected, (state) => { state.searchLoading = false; });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.selectedUser = action.payload;
    });
  },
});

export const { clearSearch, setSelectedUser } = userSlice.actions;
export default userSlice.reducer;
