import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../utils/axios';
import { User } from '../types/types'

interface AuthState {
  currentUser: User | null;
  users: User[];
  loading: boolean;
  error: string | null;
  token: string | null;
};

const initialState: AuthState = {
  currentUser: JSON.parse(localStorage.getItem('user') || 'null'),
  users: [],
  loading: false,
  error: null,
  token: null,
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
      const response = await apiClient.post('users/register/', userData);
			const { user, tokens } = response.data;

      // Сохраняем токены в localStorage
      if (tokens) {
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
      }
			return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// Список пользователей
export const fetchUsers = createAsyncThunk<
  User[],
  void,
  { rejectValue: string }
>(
  'auth/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('users/');
      return response.data.users;      
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка при загрузке пользователей'
      );
    }
  }
);

// Логин пользователя
export const loginUser = createAsyncThunk<
  User,
  { login: string; password: string },
  { rejectValue: string }
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('users/login/', credentials);
			const { user, tokens } = response.data;

      // Сохранение токенов в localStorage
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
			return user;
    } catch (error: any) {
      return rejectWithValue(
        error.response
        ? error.response.data?.message || 'Login failed on server'
        : error.message || 'Network error'
      );
    }
  }
);

// Обновление полей
export const updateUser = createAsyncThunk<
  { user: User },
  Partial<{ id: number; fullname: string; login: string; email: string; password: string; avatar: string }>,
  { rejectValue: string }
>(
  'auth/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('users/update/', userData);
			const { user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
			return { user };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update user'
      );
    }
  }
);

// Удаление пользователя
export const deleteUser = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  'auth/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`users/${userId}/`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(
      	error.response?.data?.message || 'Ошибка при удалении пользователя'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.currentUser = null;
      state.users = [];
      state.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder

    // Регистрация
    .addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(registerUser.fulfilled, (state, action) => {
      state.currentUser = action.payload.user;
      state.loading = false;
      state.error = null;
          
      // Сохраняем данные пользователя и токен в localStorage
      localStorage.setItem('user', JSON.stringify(action.payload));
      if (state.token) {
        localStorage.setItem('accessToken', state.token);
      }
    })            
    .addCase(registerUser.rejected, (state, action) => {
      state.error = action.payload as string;
      state.loading = false;
      state.currentUser = null;
    })
  
		// Логин
    .addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
		  localStorage.setItem('user', JSON.stringify(action.payload));
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.error = action.payload as string;
      state.loading = false;
    })
        
		// Получение спикска
    .addCase(fetchUsers.pending, (state) => {
      state.loading = true;
    	state.error = null;
    })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      state.users = action.payload;
      state.loading = false;
    })
    .addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Ошибка при загрузке пользователей';
    })
        
		// Обновление полей
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
			state.loading = false;
    })
    .addCase(updateUser.pending, (state) => {
      state.loading = true;
    })
    .addCase(updateUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update user';
    })
        
		// Логика удаления пользователя
    .addCase(deleteUser.fulfilled, (state, action) => {
      if (state.users) {
        state.users = state.users.filter((user) => user.id !== action.payload);
      }
    })
    .addCase(deleteUser.rejected, (state, action) => {
      state.error = action.payload || 'Ошибка при удалении пользователя';
    })
  },
});

export const { logoutUser } = authSlice.actions;

export default authSlice.reducer;
