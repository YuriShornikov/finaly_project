import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { logoutUser, updateUser } from '../../slice/authSlice';
import { fetchFiles, uploadFile } from '../../slice/fileSlice';
import { useNavigate } from 'react-router-dom';
import { AdminUserList } from '../Admin/AdminUserList';
import { FilesList } from '../../components/FilesList/FilesList';
import { User, validateLogin, validateEmail, validatePassword } from '../../types/types';
import './Profile.css';

export const Profile: React.FC = () => {
  const user = useAppSelector((state) => state.auth.currentUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
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
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  const handleEditField = (field: string, value: string) => {
    setEditingField(field);
    setFieldValue(field === 'password' ? '' : value);
    // if (field === 'file') {
    //   setAvatarFile(null); // Очищаем выбранный файл
    //   if (fileInputRef.current) {
    //     fileInputRef.current.value = ''; // Сбрасываем значение input
    //   }
    // } else {
    //   setFieldValue(field === 'password' ? '' : value);
    // }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setError(null);

    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Сброс input
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
    const updatedData: User = { ...user, [editingField]: fieldValue };
    try {
      await dispatch(updateUser(updatedData));
      setEditingField(null);
    } catch (err) {
      setError('Ошибка при обновлении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isAvatar: boolean = false) => {
    if (event.target.files) {
      if (isAvatar) {
        const file: File = event.target.files[0];
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          setError('Загружать можно только изображения!');
          return;
        }
        setAvatarFile(file);
      } else {
        const files: File[] = Array.from(event.target.files);
        setNewFiles((prevFiles) => [...prevFiles, ...files]);
      }
    }
  };

  const handleUploadFiles = async (isAvatar: boolean = false) => {
    if (!user || (isAvatar ? !avatarFile : newFiles.length === 0)) return;
    setLoading(true);
    const formData = new FormData();
    if (comment) formData.append('comment', comment);
    if (isAvatar) {
      formData.append('file', avatarFile!);
    } else {
      newFiles.forEach((file) => formData.append('file', file));
    }
    try {
      const uploadedFile = await dispatch(uploadFile({ userId: user.id, fileData: formData })).unwrap();
      if (isAvatar && uploadedFile.uploaded_files[0]?.url) {
        await dispatch(updateUser({ id: user.id, avatar: uploadedFile.uploaded_files[0].url }));
      }
      setAvatarFile(null);
      setNewFiles([]);
      setComment('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Ошибка при загрузке файлов');
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
          {/* <div className='avatar'>
            <strong>Аватарка:</strong> */}
              {!avatarFile ? (
                <div className='avatar'>
                  <strong>Аватарка:</strong>
                  <input
                    id='file'
                    className='avatar-input'
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileChange(e, true)}
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
                  onClick={() => handleUploadFiles(true)}
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
      <section className='data__files'>
        <div className='add__files'>
          <h4>Добавить файлы:</h4>
          <input 
            type='file'
            multiple 
            onChange={handleFileChange} 
            ref={fileInputRef} 
          />
          <label>
            Комментарий:
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
            />
          </label>
          <button
            className='btn'
            onClick={() => handleUploadFiles(false)}
            disabled={newFiles.length === 0 || loading}
          >
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </section>
      <section>
        <FilesList user={user} />
      </section>
      {user.is_admin && <AdminUserList />}
    </div>
  );
};
