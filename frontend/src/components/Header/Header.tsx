import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const handleHome = () => {
    navigate('/');
  }

  const handleProfile = () => {
    navigate('/profile');
  }
  
	return (
    <header>
      <h1 onClick={() => {handleHome()}}>Облачный сервис</h1>
      <button className="btn-profile" onClick={handleProfile}>
        <img src="/images/icon-lc2.png" alt="" />
      </button>
    </header>
  );
};
