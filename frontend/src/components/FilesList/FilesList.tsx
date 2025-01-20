import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/hooks';
import { User, File as CustomFile } from '../../types/types';
import { FileView } from '../FileView/FileView';
import { useAppDispatch } from '../../store/store';
import { fetchFiles } from '../../slice/fileSlice';

interface FilesListProps {
  user: User;
}

export const FilesList: React.FC<FilesListProps> = ({ user }) => {
  const dispatch = useAppDispatch();
  const files = useAppSelector((state) => state.files.files);
  const [selectedFile, setSelectedFile] = useState<CustomFile | null>(null);

  // Переход к редактированию файла
  const handleFileClick = (file: CustomFile) => {
    if (file) setSelectedFile(file);
  };

  // Закрытие редакта
  const handleClose = () => {
    setSelectedFile(null);
    dispatch(fetchFiles({ userId: user.id }));
  };

  return (
  	<>
    	{selectedFile ? (
        <FileView file={selectedFile} onClose={handleClose} />
      ) : (
      	<>  
          <h2>Загруженные файлы:</h2>
          {files && Array.isArray(files) && files.length > 0 ? (
            <table border={1} cellPadding='5' cellSpacing='0'>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Наименование файла</th>
                  <th>Размер файла</th>
                  <th>Тип файла</th>
                  <th>Дата загрузки</th>
                  <th>Дата последнего скачивания</th>
                  <th>Комментарий</th>
                  <th>Редактирование</th>
                </tr>
              </thead>
            	<tbody>
              	{files
                	.filter(
                  	(file) =>
                  	  file.user_id === user.id &&
                  		file.user_id !== undefined
                	)
                	.map((file) => (
                  	<tr key={file.id || `${file.file_name}-${Math.random()}`}>
                    	<td>{file.id}</td>
                    	<td>{file.file_name}</td>
                    	<td>{file.file_size}</td>
                    	<td>{file.type}</td>
                    	<td>{file.upload_date}</td>
                    	<td>{file.last_downloaded}</td>
                    	<td>{file.comment}</td>
                  		<td className='file-view' onClick={() => handleFileClick(file)}>
                      	просмотр и редактирование
                    	</td>
                  	</tr>
                	))
								}
            	</tbody>
            </table>
          ) : (
            <p>Нет доступных файлов</p>
          )}
        </>
      )}
    </>
  );
};
