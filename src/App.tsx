import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import Chat from './components/Chat';
import AdminUsers from './components/AdminUsers';
import AdminModels from './components/AdminModels';
import AdminApiKeys from './components/AdminApiKeys';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('chat');

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

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <Chat />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-models':
        return <AdminModels />;
      case 'admin-api-keys':
        return <AdminApiKeys />;
      default:
        return <Chat />;
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;