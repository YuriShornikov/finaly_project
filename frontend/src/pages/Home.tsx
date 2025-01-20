import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();
    
  const handleRegister = () => {
    navigate('/registration');
  };
    
  const handleLogin = () => {
    navigate('/login');
  };
    
  return (
    <div className="home">
      <p>
        На нашем сайте вы можете осуществлять хранение данных. Зарегистрироруйтесь/авторизуйтесь, 
        чтобы получить доступ к личному кабинету и хранилищу данных. 
        Мы предлагаем удобный интерфейс и совершенно бесплатное пользование.
      </p>
      <div className="btn-block">
        <button className="btn" onClick={handleRegister}>
          Регистрация
        </button>
        <button className="btn" onClick={handleLogin}>
          Логин
        </button>
      </div>
    </div>
  );
};
