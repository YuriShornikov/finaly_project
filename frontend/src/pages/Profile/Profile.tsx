import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { logoutUser, updateUser } from '../../slice/authSlice';
import { fetchFiles, uploadFile } from '../../slice/fileSlice';
import { useNavigate } from 'react-router-dom';
import { AdminUserList } from '../Admin/AdminUserList';
import { validateLogin, validateEmail, validatePassword } from '../../types/types';
import './Profile.css';

export const Profile: React.FC = () => {
  const user = useAppSelector((state) => state.auth.currentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({
    login: '',
    email: '',
    password: '',
    fullname: '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchFiles({ userId: user.id }));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const handleCloud = () => {
    navigate('/cloud');
  };

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setFieldValue(field === 'password' ? '' : value);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setError(null);

    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Валидация перед сохранением
  const handleSaveField = async () => {
    if (!user || !editingField || !fieldValue) return;

    const newErrors = { login: '', email: '', password: '', fullname: '' };
    let isValid = true;

    // Валидация
    if (editingField === 'login' && !validateLogin(fieldValue)) {
      newErrors.login = 'Логин должен содержать только латинские буквы и цифры, первый символ — буква, длина от 4 до 20 символов';
      isValid = false;
    }
    if (editingField === 'email' && !validateEmail(fieldValue)) {
      newErrors.email = 'Email должен соответствовать формату адресов электронной почты';
      isValid = false;
    }
    if (editingField === 'password' && !validatePassword(fieldValue)) {
      newErrors.password = 'Пароль должен содержать не менее 6 символов: как минимум одна заглавная буква, одна цифра и один специальный символ';
      isValid = false;
    }
    if (editingField === 'fullname' && fieldValue.trim() === '') {
      newErrors.fullname = 'Введите корректное значение';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) return;

    setLoading(true);
    const updatedData = { id: user.id, [editingField]: fieldValue };
    try {
      await dispatch(updateUser(updatedData));
      setEditingField(null);
    } catch (err) {
      setError('Ошибка при обновлении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file: File = event.target.files[0];
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        setError('Загружать можно только изображения!');
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!user || !avatarFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', avatarFile);

    try {
      const uploadedFile = await dispatch(uploadFile({ userId: user.id, fileData: formData })).unwrap();
      if (uploadedFile.uploaded_files[0]?.url) {
        await dispatch(updateUser({ id: user.id, avatar: uploadedFile.uploaded_files[0].url }));
      }
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Ошибка при загрузке аватарки');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Логин', field: 'login', value: user?.login || '' },
    { label: 'Полное имя', field: 'fullname', value: user?.fullname || '' },
    { label: 'Email', field: 'email', value: user?.email || 'Нет email' },
    { label: 'Пароль', field: 'password', value: '********' },
  ];

  if (!user) {
    return <p>Пожалуйста, войдите в систему</p>;
  }

  return (
    <div>
      <div className='profile__top'>
        <h1>Добро пожаловать, {user.fullname}</h1>
        <button
          className='btn exit' 
          onClick={handleLogout}
        >
          Выход
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <section className='profile'>
        <img
          src={user.avatar}
          alt='аватарка'
        />
        <div className='profile__change'>
              {!avatarFile ? (
                <div className='avatar'>
                  <strong>Аватарка:</strong>
                  <input
                    id='file'
                    className='avatar-input'
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  <label htmlFor='file' className='btn'>Выбрать файл</label>
                </div>
              ) : (
              <div className='avatar__redactor'>
                <strong>Аватарка:</strong>
                <p className="file-info">
                  Вы выбрали: <strong>{avatarFile.name}</strong>
                </p>
                <button
                  className='btn'
                  onClick={handleUploadAvatar}
                  disabled={!avatarFile || loading}
                >
                  {loading ? 'Загрузка...' : 'Установить'}
                </button>
                <button className="btn cancel" onClick={handleCancelEdit}>
                  Отмена
                </button> 
              </div> 
            )}  
          {/* </div> */}
          <ul className='user__field'>
            {fields.map(({ label, field, value }) =>
              editingField === field ? (
                <li key={field} className='redact'>
                  <strong>{label}:</strong>
                  <input
                    type={field === 'password' ? 'password' : 'text'}
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                  />
                  <button className='btn' onClick={handleSaveField} disabled={loading}>
                    Сохранить
                  </button>
                  <button className='btn cancel' onClick={handleCancelEdit}>
                    Отмена
                  </button>
                  {errors[field] && <p className='error'>{errors[field]}</p>}
                </li>
              ) : (
                <li key={field}>
                  <strong>{label}:</strong>
                  {value}
                  <button className='btn' onClick={() => handleEditField(field, value)}>
                    Редактировать
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      </section>
      <h1>Файловое хранилище</h1>
      <button className="btn" onClick={handleCloud}>Войти</button>
      {user.is_admin && <AdminUserList />}
    </div>
  );
};
