import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL + 'api/';

export const getCsrfToken = async (): Promise<string> => {
  const response = await apiClient.get('/csrf/', { withCredentials: true });
  return response.data.csrfToken;
}

// Настраиваем базовый клиент
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Функция для получения клиента с актуальным CSRF токеном
export const getApiClientWithCsrf = async () => {
  const csrfToken = await getCsrfToken();
  apiClient.defaults.headers['X-CSRFToken'] = csrfToken;
  return apiClient;
}





