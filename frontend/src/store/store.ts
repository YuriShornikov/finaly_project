import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slice/authSlice';
import fileReducer from '../slice/fileSlice';
import { useDispatch } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
});

export const useAppDispatch = () => useDispatch<AppDispatch>();
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
