import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Settings, Users, LogOut, Bot, Key, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children, currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const navigation = [
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  const settingsItems = isAdmin ? [
    { id: 'admin-users', name: 'Users', icon: Users },
    { id: 'admin-models', name: 'Models', icon: Bot },
    { id: 'admin-api-keys', name: 'API Keys', icon: Key },
  ] : [];

  const handleSettingsClick = () => {
    if (settingsItems.length > 0) {
      setSettingsExpanded(!settingsExpanded);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-5 border-b border-gray-200">
            <Bot className="w-8 h-8 text-blue-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">TBridge</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
            
            {/* Settings Menu */}
            {isAdmin && (
              <div className="space-y-1">
                <button
                  onClick={handleSettingsClick}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    settingsItems.some(item => item.id === currentPage)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                  </div>
                  {settingsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {/* Settings Submenu */}
                {settingsExpanded && (
                  <div className="ml-4 space-y-1">
                    {settingsItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onPageChange(item.id)}
                          className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-700">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;