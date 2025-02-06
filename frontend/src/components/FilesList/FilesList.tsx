import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { User, File as CustomFile } from '../../types/types';
import { FileView } from '../FileView/FileView';
import { useAppDispatch } from '../../store/store';
import { fetchFiles } from '../../slice/fileSlice';
import './FileList.css';
import { useNavigate } from 'react-router-dom';

interface FilesListProps {
  user: User;
}

export const FilesList: React.FC<FilesListProps> = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const files = useAppSelector((state) => state.files.files);
  const [selectedFile, setSelectedFile] = useState<CustomFile | null>(null);

  // Переход к редактированию файла
  const handleFileClick = (file: CustomFile) => {
    if (file) setSelectedFile(file);
  };

  const handleProfile = () => {
    navigate('/profile')
  }

  // Закрытие редакта
  const handleClose = () => {
    setSelectedFile(null);
    dispatch(fetchFiles({ userId: user.id }));
  };

  interface Field {
    key: keyof CustomFile;
    label: string;
  }

  // Константа для полей
  const fileFields: Field[] = [
    { label: 'Id', key: 'id' },
    { label: 'Наименование файла', key: 'file_name' },
    { label: 'Размер файла', key: 'file_size' },
    { label: 'Тип файла', key: 'type' },
    { label: 'Дата загрузки', key: 'upload_date' },
    { label: 'Дата последнего скачивания', key: 'last_downloaded' },
    { label: 'Комментарий', key: 'comment' },
  ];

  return (
    <>
      {selectedFile ? (
        <FileView file={selectedFile} onClose={handleClose} />
      ) : (
        <>
          <h2>Загруженные файлы:</h2>
          {files && Array.isArray(files) && files.length > 0 ? (
            <div className='responsive-table'>

              {/* Для большого экрана */}
              <table className='desktop-table'>
                <thead>
                  <tr>
                    {fileFields.map((field) => (
                      <th key={field.key}>{field.label}</th>
                    ))}
                    <th>Редактирование</th>
                  </tr>
                </thead>
                <tbody>
                  {files
                    .filter((file) => file.user_id === user.id && file.user_id !== undefined)
                    .map((file) => (
                      <tr key={file.id || `${file.file_name}-${Math.random()}`}>
                        {fileFields.map((field) => (
                          <td key={field.key}>{file[field.key]}</td>
                        ))}
                        <td>
                          <button className='btn' onClick={() => handleFileClick(file)}>
                            Открыть файл
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Для маленького экрана */}
              <div className='mobile-list'>
                {files
                  .filter((file) => file.user_id === user.id && file.user_id !== undefined)
                  .map((file) => (
                    <div key={file.id || `${file.file_name}-${Math.random()}`} className='file-row'>
                      {fileFields.map((field) => (
                        <div key={field.key} className='file-info'>
                          <div className='file-info-label'>{field.label}:</div>
                          <div className='file-info-value'>{file[field.key]}</div>
                        </div>
                      ))}
                      <div className='file-action'>
                        <button className="btn" onClick={() => handleFileClick(file)}>
                          Открыть файл
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p>Нет доступных файлов</p>
          )}
          <button className="btn back" onClick={handleProfile}>Профиль</button>
        </>
      )}
    </>
  );
};
