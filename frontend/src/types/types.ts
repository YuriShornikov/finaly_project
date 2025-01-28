export interface User {
  id: number;
  login: string;
  fullname: string;
  email: string;
  is_admin?: boolean;
  all_users?: User[];
  avatar?: string;
  files?: File[] | null;
}

export interface File {
  id: number;
  file_name?: string;
  file_size?: number;
  type: string;
  url: string;
  upload_date?: string;
  last_downloaded?: string;
  user_id: number;
  comment?: string;
}

export interface UploadedFile {
  id: number;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface UploadResponse {
  uploaded_files: File[];
}

// Функция валидации
export const validateLogin = (login: string) => /^[a-zA-Z][a-zA-Z0-9]{3,19}$/.test(login);
export const validateEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
export const validatePassword = (password: string) => /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(password);


