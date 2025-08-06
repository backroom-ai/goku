import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, MessageSquare, Settings, LogOut, Sun, Moon, Bot } from 'lucide-react';

const Layout = ({ children, currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-all duration-200">
      {/* Glassmorphism Sidebar */}
      <div className="w-16 backdrop-blur-xl bg-white/20 dark:bg-dark-800/20 border-r border-white/20 dark:border-dark-700/20 flex flex-col shadow-glass dark:shadow-glass-dark">
        {/* Logo */}
        <div className="flex items-center justify-center py-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lift dark:shadow-lift-dark transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative transform hover:scale-105 hover:-translate-y-0.5 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lift dark:shadow-lift-dark'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-dark-700/30 backdrop-blur-sm'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                
                {/* Enhanced Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl text-gray-900 dark:text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-700/20 transform translate-x-2 group-hover:translate-x-0">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white/90 dark:bg-dark-800/90 rotate-45 border-l border-b border-white/20 dark:border-dark-700/20"></div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-6 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-dark-700/30 backdrop-blur-sm transition-all duration-200 group relative transform hover:scale-105 hover:-translate-y-0.5"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            
            <div className="absolute left-full ml-3 px-3 py-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl text-gray-900 dark:text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-700/20 transform translate-x-2 group-hover:translate-x-0">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white/90 dark:bg-dark-800/90 rotate-45 border-l border-b border-white/20 dark:border-dark-700/20"></div>
            </div>
          </button>

          {/* Settings (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => onPageChange('settings')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative transform hover:scale-105 hover:-translate-y-0.5 ${
                currentPage.startsWith('settings')
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lift dark:shadow-lift-dark'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-dark-700/30 backdrop-blur-sm'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              
              <div className="absolute left-full ml-3 px-3 py-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl text-gray-900 dark:text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-700/20 transform translate-x-2 group-hover:translate-x-0">
                Settings
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white/90 dark:bg-dark-800/90 rotate-45 border-l border-b border-white/20 dark:border-dark-700/20"></div>
              </div>
            </button>
          )}

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lift dark:shadow-lift-dark transform transition-all duration-200 hover:scale-105">
              <span className="text-sm font-medium text-white tracking-wide">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 p-2 rounded-xl group relative transform hover:scale-105 hover:-translate-y-0.5 hover:bg-white/20 dark:hover:bg-dark-700/20 backdrop-blur-sm"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              
              <div className="absolute left-full ml-3 px-3 py-2 bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl text-gray-900 dark:text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-glass dark:shadow-glass-dark border border-white/20 dark:border-dark-700/20 transform translate-x-2 group-hover:translate-x-0">
                Sign out
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white/90 dark:bg-dark-800/90 rotate-45 border-l border-b border-white/20 dark:border-dark-700/20"></div>
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