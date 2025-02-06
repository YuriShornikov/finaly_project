import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/hooks';
import { loginUser } from '../slice/authSlice';
import { useNavigate } from 'react-router-dom';
import { checkAuth } from '../slice/authSlice';

export const Login: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error, currentUser } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // Проверка авторизации пользователя
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) {
      navigate('/profile');
    }
  }, [currentUser, navigate]);

  const handleHome = () => {
    navigate('/');
  }

  const handleRegistr = () => {
    navigate('/registration')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ login, password }))
    .unwrap()
    .then(() => navigate('/profile'))
    .catch(() => {});
  };

  return (
    <div className="form">
      <h1>Войти в личный кабинет</h1>
      <form className="login" onSubmit={handleSubmit}>
        <div className="inp">
          <label htmlFor="input-login">Login</label>
          <input
            id="input-login"
            type="text"
            placeholder="Введите логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            autoComplete="current-login"
          />
        </div>
        <div className="inp">
          <label htmlFor="input-pas">Password</label>
          <input
            id="input-pas"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
      	</div>
        <p>{error}</p>
        <div className="btn__block">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Войти'}
          </button>
          <button className="btn cancel" type="button" onClick={handleHome}>Отмена</button>
        </div>
        <button className="btn__switch" type="button" onClick={handleRegistr}>У вас нет аккаунта?</button>
      </form>
    </div>
  );
};
