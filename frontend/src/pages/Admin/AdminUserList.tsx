import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/hooks';
import { updateUser, deleteUser, fetchUsers } from '../../slice/authSlice';
import { User } from '../../types/types';
import { FilesList } from '../../components/FilesList/FilesList';
import { validateLogin, validateEmail} from '../../types/types';
import './AdminUserList.css'

interface UserErrors {
  [userId: number]: {
    login?: string;
    email?: string;
    fullname?: string;
  };
}


export const AdminUserList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [editedUsers, setEditedUsers] = useState<{ [key: number]: Partial<User> }>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<UserErrors>({});

  useEffect(() => {
    dispatch(fetchUsers());
	}, [dispatch]);

  const handleAdminEditField = (userId: number, field: keyof User, value: string | boolean) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }));
  };

  // Сохранение изменения полей
  const handleAdminSaveField = async (userId: number) => {
    const updatedUser = editedUsers[userId];
    if (!updatedUser) return;
  
    // Очистка текущих ошибок перед новой проверкой
    setErrors((prev) => ({ ...prev, [userId]: {} }));
  
    const newErrors: UserErrors = {};
    let isValid = true;
  
    // Валидация только изменённых полей
    if (updatedUser.login !== undefined) {
      if (!validateLogin(updatedUser.login.trim())) {
        newErrors[userId] = {
          ...newErrors[userId],
          login: 'Логин должен содержать только латинские буквы и цифры, первый символ — буква, длина от 4 до 20 символов',
        };
        isValid = false;
      }
    }
  
    if (updatedUser.email !== undefined) {
      if (!validateEmail(updatedUser.email.trim())) {
        newErrors[userId] = {
          ...newErrors[userId],
          email: 'Email должен соответствовать формату адресов электронной почты',
        };
        isValid = false;
      }
    }
  
    if (updatedUser.fullname !== undefined) {
      if (updatedUser.fullname.trim() === '') {
        newErrors[userId] = {
          ...newErrors[userId],
          fullname: 'Введите корректное значение',
        };
        isValid = false;
      }
    }
  
    // Если есть ошибки — обновляем состояние ошибок и прекращаем выполнение
    if (!isValid) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }
  
    // Отправка обновленных данных
    try {
      await dispatch(updateUser({ id: userId, ...updatedUser }));
      setEditedUsers((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
  
      // Удаляем ошибки после успешного сохранения
      setErrors((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId: number) => {
    try {
      await dispatch(deleteUser(userId));
      setEditedUsers((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    navigate(`/cloud/${user.id}`);
  };

  // Возврат
  const handleBack = () => {
    setSelectedUser(null);
  };

  return (
    <section>
      {selectedUser ? (
        <div>
          <h2>Файлы пользователя {selectedUser.fullname}</h2>
          <FilesList user={selectedUser} />
					<button
						className='btn back'
						onClick={handleBack}
					>
						Назад к списку
					</button>
        </div>
      ) : (
        <>
          <h2>Список пользователей</h2>
          {users.length > 0 ? (
            <>
              <div className='user__list'>
                <table className='user__list__max'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Login</th>
                      <th>FullName</th>
                      <th>Email</th>
                      <th>Права Admin</th>
                      <th>Сохранить изменения</th>
                      <th>Удалить пользователя</th>
                      <th>Файлы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <input
                            type="text"
                            value={editedUsers[user.id]?.login ?? user.login}
                            onChange={(e) =>
                              handleAdminEditField(user.id, 'login', e.target.value)
                            }
                          />
                          {errors[user.id]?.login && <p className="error">{errors[user.id].login}</p>}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editedUsers[user.id]?.fullname ?? user.fullname}
                            onChange={(e) =>
                              handleAdminEditField(user.id, 'fullname', e.target.value)
                            }
                          />
                          {errors[user.id]?.fullname && <p className="error">{errors[user.id].fullname}</p>}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editedUsers[user.id]?.email ?? user.email}
                            onChange={(e) =>
                              handleAdminEditField(user.id, 'email', e.target.value)
                            }
                          />
                          {errors[user.id]?.email && <p className="error">{errors[user.id].email}</p>}
                        </td>
                        <td>
                          <input
                            className="checkbox"
                            type="checkbox"
                            checked={editedUsers[user.id]?.is_admin ?? user.is_admin}
                            onChange={(e) =>
                              user.id !== currentUser?.id && handleAdminEditField(user.id, 'is_admin', e.target.checked)
                            }
                            disabled={user.id === currentUser?.id}
                          />
                        </td>
                        <td>
                          <button className="btn table" onClick={() => handleAdminSaveField(user.id)}>
                            Сохранить
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn delete table"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            Удалить
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn table"
                            onClick={() => handleUserClick(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            Открыть
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Для маленького экрана */}
              <div className='user__list__mobile'>
                {users.map((user) => (
                  <div key={user.id} className="user-row">
                    <div className="user-info">
                      <div className="user-info-label">ID:</div>
                      <div className="user-info-value">{user.id}</div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Login:</div>
                      <div className="user-info-value">
                        <input
                          type="text"
                          value={editedUsers[user.id]?.login ?? user.login}
                          onChange={(e) => handleAdminEditField(user.id, 'login', e.target.value)}
                        />
                        {errors[user.id]?.login && <p className="error">{errors[user.id].login}</p>}
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">FullName:</div>
                      <div className="user-info-value">
                        <input
                          type="text"
                          value={editedUsers[user.id]?.fullname ?? user.fullname}
                          onChange={(e) => handleAdminEditField(user.id, 'fullname', e.target.value)}
                        />
                        {errors[user.id]?.fullname && <p className="error">{errors[user.id].fullname}</p>}
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Email:</div>
                      <div className="user-info-value">
                        <input
                          type="text"
                          value={editedUsers[user.id]?.email ?? user.email}
                          onChange={(e) => handleAdminEditField(user.id, 'email', e.target.value)}
                        />
                        {errors[user.id]?.email && <p className="error">{errors[user.id].email}</p>}
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Права Admin:</div>
                      <div className="user-info-value">
                        <input
                          className="checkbox"
                          type="checkbox"
                          checked={editedUsers[user.id]?.is_admin ?? user.is_admin}
                          onChange={(e) =>
                            user.id !== currentUser?.id && handleAdminEditField(user.id, 'is_admin', e.target.checked)
                          }
                          disabled={user.id === currentUser?.id}
                        />
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Сохранить изменения</div>
                      <div className="user-info-value">
                        <button className="btn" onClick={() => handleAdminSaveField(user.id)}>
                          Сохранить
                        </button>
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Удалить пользователя</div>
                      <div className="user-info-value">
                        <button
                          className="btn delete"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                    <div className="user-info">
                      <div className="user-info-label">Файлы</div>
                      <div className="user-info-value">
                        <button
                          className="btn"
                          onClick={() => handleUserClick(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          Открыть
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>Пользователи не найдены.</p>
          )}
        </>
      )}
    </section>
  );
};
