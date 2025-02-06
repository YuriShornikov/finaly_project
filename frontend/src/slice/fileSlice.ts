import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiClientWithCsrf, getCsrfToken } from '../utils/axios';
import { File, UploadResponse } from '../types/types';

interface FileState {
  files: File[];
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  files: [],
  loading: false,
  error: null,
};

// Получение списка файлов пользователя
export const fetchFiles = createAsyncThunk<
  File[],
  { userId: number },
  { rejectValue: string }
>('files/fetchFiles', async ({ userId }, { rejectWithValue }) => {
  try {
    await getCsrfToken();
    const client = await getApiClientWithCsrf();
    const response = await client.get(`/files/${userId}/`);
    return response.data;
  } catch (error: any) {
    console.error('Error in fetchFiles:', error);
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при получении списка файлов'
    );
  }
});

// Загрузка файла
export const uploadFile = createAsyncThunk<
  UploadResponse,
  { userId: number; fileData: FormData },
  { rejectValue: string }
>('files/uploadFile', async ({ userId, fileData }, { rejectWithValue }) => {
  try {
    const client = await getApiClientWithCsrf();
    const response = await client.post(`/files/${userId}/upload/`, fileData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
    });
      return response.data as UploadResponse;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при загрузке файла'
    );
  }
});

// Удаление файла
export const deleteFile = createAsyncThunk<
  number,
  { userId: number; fileId: number },
  { rejectValue: string }
>('files/deleteFile', async ({ userId, fileId }, { rejectWithValue }) => {
  try {
    const client = await getApiClientWithCsrf();
    await client.delete(`/files/${userId}/delete/${fileId}/`);
    return fileId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при удалении файла'
    );
  }
});

// Переименование файла
export const renameFile = createAsyncThunk<
  File,
  { fileId: number; newName: string },
  { rejectValue: string }
>('files/renameFile', async ({ fileId, newName }, { rejectWithValue }) => {
  try {
    const client = await getApiClientWithCsrf();
    const response = await client.patch(`/files/${fileId}/update/`, { new_name: newName });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при переименовании файла'
    );
  }
});

// Обновление комментария файла
export const updateFileComment = createAsyncThunk<
  File,
  { fileId: number; newComment: string },
  { rejectValue: string }
>('files/updateFileComment', async ({ fileId, newComment }, { rejectWithValue }) => {
  try {
    const client = await getApiClientWithCsrf();
    const response = await client.patch(`/files/${fileId}/update/`, { 
      comment: newComment, });
    return response.data; // Возвращаем обновленный файл
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при обновлении комментария'
    );
  }
});

// Скачивание файла
export const downloadFile = createAsyncThunk<
  void,
  { fileId: number, fileName?: string },
  { rejectValue: string }
>('files/downloadFile', async ({ fileId, fileName }, { rejectWithValue }) => {
  try {
    const client = await getApiClientWithCsrf();
    const response = await client.get(`/files/${fileId}/download/`, {
      responseType: 'blob',
    });

    // Проверка корректности данных
    const fileBlob = response.data;
        
    // Создание ссылки для скачивания
    const fileURL = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
     link.href = fileURL;

    const downloadFileName = fileName || `file_${fileId}`;
		link.download = downloadFileName;
    link.click();
    URL.revokeObjectURL(fileURL);
    return;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Ошибка при скачивании файла'
    );
  }
});


// Утилиты для обработки состояний
const handlePending = (state: FileState) => {
  state.loading = true;
  state.error = null;
};

const handleRejected = (state: FileState, action: { payload: string | undefined }) => {
  state.loading = false;
  state.error = action.payload || 'Произошла ошибка';
};

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    resetState: (state) => {
      state.files = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
            
      // Получение файлов
      .addCase(fetchFiles.pending, handlePending)
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.files = action.payload;
        state.loading = false;
      })
      .addCase(fetchFiles.rejected, handleRejected)
            
			// Загрузка файла
      .addCase(uploadFile.pending, handlePending)
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.push(...action.payload.uploaded_files);
        state.loading = false;
      })
      .addCase(uploadFile.rejected, handleRejected)

			// Удаление файла
      .addCase(deleteFile.pending, handlePending)
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file.id !== action.payload);
      	state.loading = false;
      })
      .addCase(deleteFile.rejected, handleRejected)
            
			// Переименование файла
      .addCase(renameFile.fulfilled, (state, action) => {
        const index = state.files.findIndex((file) => file.id === action.payload.id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
      })
      .addCase(renameFile.rejected, handleRejected)
            
			// Обновление комментария
      .addCase(updateFileComment.fulfilled, (state, action) => {
        const index = state.files.findIndex((file) => file.id === action.payload.id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
      })
      .addCase(updateFileComment.rejected, handleRejected)
            
			// Скачивание файла
      .addCase(downloadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Неизвестная ошибка при скачивании файла';
      });
    },
});

export const { resetState } = fileSlice.actions;

export default fileSlice.reducer;
