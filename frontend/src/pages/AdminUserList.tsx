import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { updateUser, deleteUser, fetchUsers } from '../slice/authSlice';
import { User } from '../types/types';
import { FilesList } from '../components/FilesList/FilesList';

export const AdminUserList: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [editedUsers, setEditedUsers] = useState<{ [key: number]: Partial<User> }>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
    if (updatedUser) {
      try {
        await dispatch(updateUser({ id: userId, ...updatedUser }));
        setEditedUsers((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      } catch (err) {
        console.error('Failed to update user:', err);
      }
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId: number) => {
    try {
      await dispatch(deleteUser(userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

	// Переход к файлам пользователя
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
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
            <table border={1} cellPadding="5" cellSpacing="0">
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
												type='text'
												value={editedUsers[user.id]?.login ?? user.login}
												onChange={(e) =>
													handleAdminEditField(user.id, 'login', e.target.value)
												}
											/>
										</td>
                    <td>
                      <input
                        type='text'
                      	value={editedUsers[user.id]?.fullname ?? user.fullname}
                        onChange={(e) =>
                          handleAdminEditField(user.id, 'fullname', e.target.value)
                    	  }
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        value={editedUsers[user.id]?.email ?? user.email}
                        onChange={(e) =>
                          handleAdminEditField(user.id, 'email', e.target.value)
                        }
                      />
                  	</td>
                  	<td>
                      <input
                        className='checkbox'
                        type='checkbox'
                        checked={editedUsers[user.id]?.is_admin ?? user.is_admin}
                        onChange={(e) =>
                          user.id !== currentUser?.id && handleAdminEditField(user.id, 'is_admin', e.target.checked)
                        }
                    	  disabled={user.id === currentUser?.id}
                      />
                    </td>
                    <td>
                      <button
												className='btn table'
												onClick={() => handleAdminSaveField(user.id)}
											>
                        Сохранить
                      </button>
                    </td>
										<td>
                      <button
												className='btn delete table'
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        Удалить
                      </button>
                    </td>
                    <td>
                      <button
												className='btn table'
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
          ) : (
            <p>Пользователи не найдены.</p>
          )}
        </>
      )}
    </section>
  );
};

