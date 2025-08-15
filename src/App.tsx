import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Chat from './components/Chat';
import Settings from './components/Settings';
import api from './utils/api';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('chat');
  const [resetToWelcome, setResetToWelcome] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d0d0d] dark:border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handlePageChange = (page) => {
    if (page === 'chat') {
      // Trigger reset to welcome view when logo is clicked
      setResetToWelcome(true);
      // Reset the flag after a brief moment to allow the Chat component to react
      setTimeout(() => setResetToWelcome(false), 100);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <Chat resetToWelcome={resetToWelcome} />;
      case 'settings':
        return <Settings />;
      default:
        return <Chat resetToWelcome={resetToWelcome} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;