import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { Home } from './pages/Home';
import { Footer } from './components/Footer/Footer';
import { Registration } from './pages/Registration';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile/Profile';
import { Cloud } from './pages/Cloud/Cloud';
import './App.css';

export const App: React.FC = () => {

  return (
    <>
      <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cloud/:userId?" element={<Cloud />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      <Footer />
    </>
  );
};
