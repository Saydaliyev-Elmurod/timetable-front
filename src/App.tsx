import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { getToken, removeToken } from './lib/auth';
import { User } from './types/common';

type AppView = 'landing' | 'login' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    document.documentElement.classList.add('light');

    const token = getToken();
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    } else {
      localStorage.removeItem('user');
      removeToken();
    }

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleSignIn = () => {
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('landing');
    localStorage.removeItem('user');
    removeToken(); 
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onBackToLanding={handleBackToLanding} />;
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            onLogout={handleLogout}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        );
      default:
        return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
    }
  };

  return (
    <>
      {renderCurrentView()}
      <Toaster />
    </>
  );
}
