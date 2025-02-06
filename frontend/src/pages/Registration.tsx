import React, { useState } from 'react';
import { useAppDispatch } from '../hooks/hooks';
import { registerUser } from '../slice/authSlice';
import { useNavigate } from 'react-router-dom';

export const Registration: React.FC = () => {
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [errors, setErrors] = useState({
	  login: '',
    email: '',
    password: '',
    fullname: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Проверка полей заполнения
  const validateLogin = (login: string) => /^[a-zA-Z][a-zA-Z0-9]{3,19}$/.test(login);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password);
  const validateInputs = () => {
    let isValid = true;
    const newErrors = { login: '', email: '', password: '', fullname: '' };
		if (!validateLogin(login)) {
      newErrors.login =
        'Логин должен содержать только латинские буквы и цифры, первый символ — буква, длина от 4 до 20 символов';
      isValid = false;
    }
    if (!validateEmail(email)) {
      newErrors.email = 'Email должен соответствовать формату адресов электронной почты';
      isValid = false;
    }
    if (!validatePassword(password)) {
      newErrors.password =
        'Пароль должен содержать не менее 6 символов: как минимум одна заглавная буква, одна цифра и один специальный символ';
      isValid = false;
    }
    if (fullname.trim() === '') {
      newErrors.fullname = 'Введите корректное значение';
      isValid = false;
    }
		setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
		setIsSubmitting(true);
    dispatch(registerUser({ login, email, password, fullname }))
      .unwrap()
      .then(() => navigate('/profile'))
      .catch((err) => alert(err))
      .finally(() => setIsSubmitting(false));
  };

	const handleLogin = () => {
  	navigate('/login');
  };

  return (
    <div className='form'>
      <h1>Регистрация</h1>
      <form className='registration' onSubmit={handleSubmit}>
        <div className='inp'>
          <label htmlFor='input-login'>Login</label>
          <input
            id='input-login'
            type='text'
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder='Введите логин'
            required
            autoComplete='current-login'
          />
          {<p>{errors.login}</p>}
        </div>
        <div className='inp'>
          <label htmlFor='input-name'>Fullname</label>
          <input
            id='input-name'
            type='text'
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder='Введите полное имя'
            required
            autoComplete='current-fullname'
        	/>
          {<p>{errors.fullname}</p>}
        </div>
        <div className='inp'>
          <label htmlFor='input-email'>Email</label>
          <input
            id='input-email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Введите почту @'
            required
            autoComplete='current-email'
          />
          {<p>{errors.email}</p>}
        </div>
        <div className='inp'>
          <label htmlFor='input-password'>Password</label>
          <input
            id='input-password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Введите пароль'
            required
            autoComplete='current-password'
          />
          {<p>{errors.password}</p>}
        </div>
        <div className='btn-submit'>
          <button className='btn' type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Регистрация'}
          </button>
          <button className='btn' onClick={() => handleLogin()} type='button'>
            Логин
          </button>
        </div>
      </form>
    </div>
  );
};
