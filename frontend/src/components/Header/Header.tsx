import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const handleHome = () => {
    navigate('/');
  }
  
	return (
    <header>
      <h1 onClick={() => {handleHome()}}>Облачный сервис</h1>
    </header>
  );
};
