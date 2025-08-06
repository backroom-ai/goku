import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Home from './components/Home';
import Chat from './components/Chat';
import Settings from './components/Settings';
import api from './utils/api';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleNavigateToChat = (chatId = null, initialMessage = '') => {
    setCurrentPage('chat');
    // Store chat navigation data for the Chat component
    if (chatId) {
      sessionStorage.setItem('navigateToChatId', chatId);
    }
    if (initialMessage) {
      sessionStorage.setItem('initialMessage', initialMessage);
    }
  };

  const handleCreateNewChat = async (initialMessage = '') => {
    try {
      const newChat = await api.createChat();
      
      return newChat;
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            onNavigateToChat={handleNavigateToChat}
            onCreateNewChat={handleCreateNewChat}
          />
        );
      case 'chat':
        return <Chat />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Home 
            onNavigateToChat={handleNavigateToChat}
            onCreateNewChat={handleCreateNewChat}
          />
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
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