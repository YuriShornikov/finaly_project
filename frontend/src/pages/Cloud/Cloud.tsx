import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import { fetchFiles, uploadFile } from '../../slice/fileSlice';
import { FilesList } from '../../components/FilesList/FilesList';
import { useParams, Navigate } from 'react-router-dom';
import { User } from '../../types/types';

export const Cloud: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const users = useAppSelector((state) => state.auth.users);
  const isAdmin = currentUser?.is_admin === true;
  const dispatch = useAppDispatch();

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Определяем пользователя, чьи файлы просматриваем
  const targetUser: User | undefined = userId
  ? users.find((u) => u.id === Number(userId))
  : currentUser || undefined;

  useEffect(() => {
    if (targetUser) {
      dispatch(fetchFiles({ userId: targetUser.id }));
    }
  }, [dispatch, targetUser]);

  // Если нет текущего пользователя — отправляем на страницу логина
  if (!currentUser) return <Navigate to="/login" replace />;

  // Если обычный пользователь пытается открыть чужую страницу — отправляем на свою
  if (!isAdmin && userId && Number(userId) !== currentUser.id) {
    return <Navigate to={`/cloud/${currentUser.id}`} replace />;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files) return;
		setNewFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
	};

  const handleUploadFiles = async () => {
    if (!targetUser || newFiles.length === 0) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (comment) formData.append('comment', comment);
    newFiles.forEach((file) => formData.append('file', file));

    try {
			console.log(targetUser.id)
      await dispatch(uploadFile({ userId: targetUser.id, fileData: formData })).unwrap();
      setNewFiles([]);
      setComment('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      dispatch(fetchFiles({ userId: targetUser.id }));
    } catch (err) {
      setError('Ошибка при загрузке файлов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Файловое хранилище</h1>
      <h3>{targetUser?.id === currentUser.id ? 'Ваши файлы' : `Файлы пользователя ${targetUser?.fullname}`}</h3>

      {(targetUser?.id === currentUser.id || isAdmin) && (
        <section className="add__files">
          <h4>Добавить файлы:</h4>
          <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} />
          <label>
            Комментарий:
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          <button className="btn" onClick={handleUploadFiles} disabled={newFiles.length === 0 || loading}>
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </section>
      )}

      {error && <p className="error">{error}</p>}
      {targetUser && <FilesList user={targetUser} />}
    </div>
  );
};
