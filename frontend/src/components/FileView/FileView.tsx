import React, { useState, useEffect } from 'react';
import { deleteFile, renameFile, updateFileComment, downloadFile } from '../../slice/fileSlice';
import { updateUser } from '../../slice/authSlice'
import { File } from '../../types/types';
import { useAppSelector, useAppDispatch } from '../../hooks/hooks';
import './FileView.css';

interface FileViewProps {
  file: File;
  onClose: () => void;
}

export const FileView: React.FC<FileViewProps> = ({ file, onClose }) => {
  const dispatch = useAppDispatch();
  const [newFileName, setNewFileName] = useState(file.file_name);
  const [comment, setComment] = useState(file.comment || "");
  const [tempFileName, setTempFileName] = useState(file.file_name);
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.currentUser);

  // Загружаем комментарий при открытии компонента
  useEffect(() => {
    setComment(file.comment || "");
    setTempFileName(file.file_name);
    setSharedLink(file.url);
  }, [file]);

  // Удаление файла
  const handleDelete = () => {
    dispatch(deleteFile({ userId: file.user_id, fileId: file.id }));
    if (file.url === user?.avatar) {
      dispatch(updateUser({id: user.id, avatar: ''}))
    }
    onClose();
  };

  // Переименование файла
  const handleRename = () => {
    if (newFileName && newFileName !== file.file_name) {
      dispatch(renameFile({ fileId: file.id, newName: newFileName }))
      .then(() => {
        setTempFileName(newFileName);
      })
      .catch((error) => {
        console.error('Ошибка при переименовании файла:', error);
      });
    }
  };

  // Сохранение коммита
  const handleSaveComment = () => {
    if (comment !== file.comment) {
      dispatch(updateFileComment({ fileId: file.id, newComment: comment }));
    }
  };

  // Загрузка файла
  const handleDownload = () => {
    dispatch(downloadFile({ fileId: file.id, fileName: file.file_name }))
    .unwrap()
    .then(() => {
        console.log('Файл успешно скачан');
    })
    .catch((error) => {
      console.error('Ошибка при скачивании файла:', error);
    });
  };

	const isImage = file.type.startsWith('image/');

  return (
  	<div className='file_view'>
      <h2>Редактирование файла: {tempFileName}</h2>
      {isImage && <img src={file.url} alt='фото' />}
      <table className='file__table'>
        <tbody>
          <tr className='file__field'>
            <td>
							<label htmlFor='file-name'>Новое имя файла:</label>
						</td>
            <td>
              <input
                id='file-name'
                type='text'
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </td>
            <td>
              <button
                className='btn'
                onClick={handleRename}>
									Сохранить
							</button>
          	</td>
          </tr>
          <tr className='file__field'>
            <td>
							<label htmlFor='file-comment'>Комментарий:</label>
						</td>
            <td>
              <textarea
                id='file-comment'
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </td>
            <td>
              <button
                className='btn'
                onClick={handleSaveComment}>
									Сохранить
							</button>
            </td>
          </tr>
          {sharedLink && (
            <tr className='file__field'>
              <td>
								<label htmlFor='file-link'>
									Ссылка для общего доступа:
								</label>
							</td>
              <td>
                <input
                  id='file-link'
                  type='text'
                  value={sharedLink}
                  readOnly
                />
              </td>
              <td>
                <button
                  className='btn'
                  onClick={() => navigator.clipboard.writeText(sharedLink)}
                 >
                  Копировать
                </button>
              </td>
            </tr>
          )}
          <tr>
            <td>
              <button 
								className='btn delete' 
								onClick={handleDelete}
							>
								Удалить файл
							</button>
            </td>
            <td>
              <button 
								className='btn close' 
								onClick={onClose}
							>
								Закрыть
							</button>
            </td>
            <td>
            	<button 
								className='btn download' 
								onClick={() => handleDownload()}
							>
								Скачать файл
							</button>
            </td>
          </tr>
        </tbody>
      </table>
		</div>
  );
};
