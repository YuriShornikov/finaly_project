import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { loginUser } from '../slice/authSlice';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
        
		// Проверка токена в localStorage
		const accessToken = localStorage.getItem('accessToken');
		if (accessToken) {
			navigate('/profile');
		}
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ login, password }))
    .unwrap()
    .then(() => navigate('/profile'))
    .catch(() => {});
  };

  return (
    <div className='form'>
      <h1>Войти в личный кабинет</h1>
      <form className='login' onSubmit={handleSubmit}>
        <div className="inp">
          <label htmlFor='input-login'>Login</label>
          <input
            id='input-login'
            type='text'
            placeholder='Введите логин'
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete='current-login'
          />
        </div>
        <div className='inp'>
          <label htmlFor='input-pas'>Password</label>
          <input
            id='input-pas'
            type='password'
            placeholder='Введите пароль'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete='current-password'
          />
      	</div>
        <p>{error}</p>
        <button className='btn' type='submit' disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};
