import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, MessageSquare, Settings, LogOut, User } from 'lucide-react';

const Layout = ({ children, currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Minimal Sidebar */}
      <div className="w-16 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Settings (bottom) */}
        <div className="px-2 py-4 border-t border-gray-200">
          {isAdmin && (
            <button
              onClick={() => onPageChange('settings')}
              className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 group relative ${
                currentPage.startsWith('settings')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Settings
              </div>
            </button>
          )}
        </div>

        {/* User info */}
        <div className="px-2 py-4 border-t border-gray-200">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 group relative"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Sign out
              </div>
            </button>
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