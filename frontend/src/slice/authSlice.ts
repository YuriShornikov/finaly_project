import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiClientWithCsrf, apiClient } from '../utils/axios';
import { User } from '../types/types';

interface AuthState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
};

// Регистрация нового пользователя
export const registerUser = createAsyncThunk<
  { user: User },
  { login: string; fullname: string; email: string; password: string },
  { rejectValue: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const client = await getApiClientWithCsrf();
      const response = await client.post('users/register/', userData);
      return { user: response.data.user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Получение списка пользователей
export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  'auth/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const client = await getApiClientWithCsrf();
      const response = await client.get('users/');
      return response.data.users;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке пользователей');
    }
  }
);

// Логин пользователя
export const loginUser = createAsyncThunk<User, { login: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('users/login/', credentials);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Проверка авторизации
export const checkAuth = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('users/check-auth/');
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Not authenticated');
    }
  }
);

// Обновление пользователя
export const updateUser = createAsyncThunk<{ user: User }, Partial<User>, { rejectValue: string }>(
  'auth/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const client = await getApiClientWithCsrf();
      const response = await client.patch('users/update/', userData);
      return { user: response.data.user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

// Удаление пользователя
export const deleteUser = createAsyncThunk<number, number, { rejectValue: string }>(
  'auth/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const client = await getApiClientWithCsrf();
      await client.delete(`users/${userId}/`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении пользователя');
    }
  }
);

// Логаут пользователя
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const client = await getApiClientWithCsrf();
      await client.post('users/logout/');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.currentUser = null;
      state.users = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.currentUser = action.payload.user;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.loading = false;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.currentUser = null;
        state.loading = false;
      })

      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload.user;

        // Если обновляется сам текущий пользователь
        if (state.currentUser?.id === updatedUser.id) {
          state.currentUser = { ...state.currentUser, ...updatedUser };
        }

        // Если обновляется другой пользователь
        if (state.users) {
          const index = state.users.findIndex((u) => u.id === updatedUser.id);
          if (index !== -1) {
            state.users[index] = { ...state.users[index], ...updatedUser };
          }
        }

        // getCsrfToken();
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.currentUser = null;
        state.users = [];
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;


