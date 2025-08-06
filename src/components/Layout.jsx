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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Modern Sidebar */}
      <div className="w-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
            <Bot className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-8 space-y-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 group relative hover:scale-110 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl'
                    : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-xl'
                }`}
                title={item.name}
              >
                <Icon className="w-6 h-6" />
                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-sm">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-6 space-y-4 border-t border-slate-200/50 dark:border-slate-700/50">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-14 h-14 flex items-center justify-center rounded-2xl text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:shadow-xl transition-all duration-300 group relative hover:scale-110"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-sm">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
            </div>
          </button>

          {/* Settings (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => onPageChange('settings')}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 group relative hover:scale-110 ${
                currentPage.startsWith('settings')
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-xl'
              }`}
              title="Settings"
            >
              <Settings className="w-6 h-6" />
              <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-sm">
                Settings
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
              </div>
            </button>
          )}

          {/* User Profile */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <span className="text-sm font-bold text-white">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 dark:text-slate-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 transition-all duration-300 p-2 rounded-xl hover:shadow-lg group relative hover:scale-110"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
              <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-sm">
                Sign out
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
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