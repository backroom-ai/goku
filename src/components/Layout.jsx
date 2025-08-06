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
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Minimalist Sidebar */}
      <div className="w-16 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
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
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors group relative ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
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
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group relative"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          </button>

          {/* Settings (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => onPageChange('settings')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors group relative ${
                currentPage.startsWith('settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Settings
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
              </div>
            </button>
          )}

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-xl group relative"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Sign out
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
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