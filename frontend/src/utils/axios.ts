import axios from 'axios';


const baseURL = import.meta.env.VITE_API_BASE_URL + 'api/';
// Настраиваем базовый URL
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем интерсептор для автоматической подстановки токена
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
