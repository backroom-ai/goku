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
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
      {/* Modern Sidebar */}
      <div className="w-16 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 shadow-sm flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                  currentPage === item.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-dark-700 text-white dark:text-dark-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-2 py-4 space-y-3 border-t border-gray-200 dark:border-dark-700">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 group relative"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-dark-700 text-white dark:text-dark-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </div>
          </button>

          {/* Settings (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => onPageChange('settings')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                currentPage.startsWith('settings')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-dark-700 text-white dark:text-dark-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                Settings
              </div>
            </button>
          )}

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 dark:text-dark-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 group relative"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-dark-700 text-white dark:text-dark-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
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