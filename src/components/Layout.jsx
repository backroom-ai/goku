import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Home, MessageSquare, Settings, LogOut, Sun, Moon } from 'lucide-react';

const Layout = ({ children, currentPage, onPageChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-[#171717] transition-colors duration-200">
      {/* Minimalist Sidebar */}
      <div className="w-16 bg-gray-50 dark:bg-[#0d0d0d] border-r border-gray-200 dark:border-[#121212] flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center py-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 193.7 183.76"
            className="w-8 h-8 fill-current text-black dark:text-white"
          >
            <path
              fill="currentColor"
              d="m25.43,113.71h-14.93v29.11h15.01c6.95,0,11.02-3.04,11.02-8.03v-.08c0-3.95-2.25-5.95-5.78-7.11,2.58-1.12,4.49-3.12,4.49-6.49v-.08c0-2-.71-3.53-1.87-4.7-1.71-1.7-4.28-2.62-7.94-2.62Zm-7.07,6.49h5.24c2.41,0,3.66.92,3.66,2.5v.08c0,1.7-1.37,2.54-3.83,2.54h-5.07v-5.12Zm10.11,13.47c0,1.71-1.41,2.66-3.87,2.66h-6.24v-5.37h6.16c2.7,0,3.95,1.04,3.95,2.62v.08Z"
            />
            <path
              fill="currentColor"
              d="m48.48,137.62h11.23l2.12,5.2h8.65l-12.39-29.32h-7.78l-12.39,29.32h8.48l2.08-5.2Zm5.66-14.55l3.24,8.28h-6.53l3.29-8.28Z"
            />
            <path
              fill="currentColor"
              d="m85.7,120.48c2.79,0,4.7,1.33,6.36,3.41l6.07-4.7c-2.58-3.58-6.4-6.07-12.35-6.07-8.82,0-15.35,6.65-15.35,15.14v.08c0,8.69,6.7,15.05,15.01,15.05,6.45,0,10.15-2.79,12.89-6.57l-6.07-4.32c-1.75,2.12-3.53,3.53-6.57,3.53-4.08,0-6.95-3.41-6.95-7.78v-.08c0-4.24,2.87-7.69,6.95-7.69Z"
            />
            <polygon
              fill="currentColor"
              points="101.8 113.71 101.8 142.82 109.86 142.82 109.86 135.29 112.82 132 120.14 142.82 129.83 142.82 118.43 126.22 129.45 113.71 119.89 113.71 109.86 125.52 109.86 113.71 101.8 113.71"
            />
            <path
              fill="currentColor"
              d="m36.33,164.09v-.08c0-2.87-.87-5.12-2.58-6.78-1.95-2-5.03-3.16-9.48-3.16h-13.77v29.11h8.07v-8.82h3.53l5.86,8.82h9.32l-6.95-10.15c3.62-1.54,5.99-4.49,5.99-8.94Zm-8.11.5c0,2.12-1.58,3.45-4.33,3.45h-5.32v-6.99h5.28c2.7,0,4.37,1.16,4.37,3.45v.08Z"
            />
            <path
              fill="currentColor"
              d="m55.13,153.49c-8.98,0-15.72,6.78-15.72,15.14v.08c0,8.36,6.65,15.05,15.64,15.05s15.72-6.78,15.72-15.14v-.08c0-8.36-6.65-15.05-15.64-15.05Zm7.4,15.22c0,4.2-2.95,7.78-7.4,7.78s-7.44-3.66-7.44-7.86v-.08c0-4.2,2.95-7.78,7.36-7.78s7.49,3.66,7.49,7.86v.08Z"
            />
            <path
              fill="currentColor"
              d="m89.69,153.49c-8.98,0-15.72,6.78-15.72,15.14v.08c0,8.36,6.65,15.05,15.64,15.05s15.72-6.78,15.72-15.14v-.08c0-8.36-6.65-15.05-15.64-15.05Zm7.4,15.22c0,4.2-2.95,7.78-7.4,7.78s-7.44-3.66-7.44-7.86v-.08c0-4.2,2.95-7.78,7.36-7.78s7.48,3.66,7.48,7.86v.08Z"
            />
            <polygon
              fill="currentColor"
              points="125 165.34 118.06 154.07 109.53 154.07 109.53 183.18 117.43 183.18 117.43 166.55 124.84 177.86 125 177.86 132.45 166.46 132.45 183.18 140.47 183.18 140.47 154.07 131.95 154.07 125 165.34"
            />
            <polygon
              fill="currentColor"
              points="34.5 73.92 34.5 103.03 42.57 103.03 42.57 91.97 52.92 91.97 52.92 103.03 60.99 103.03 60.99 73.92 52.92 73.92 52.92 84.82 42.57 84.82 42.57 73.92 34.5 73.92"
            />
            <polygon
              fill="currentColor"
              points="89.56 80.78 89.56 73.92 66.15 73.92 66.15 103.03 89.77 103.03 89.77 96.17 74.13 96.17 74.13 91.55 88.11 91.55 88.11 85.19 74.13 85.19 74.13 80.78 89.56 80.78"
            />
            <polygon
              fill="currentColor"
              points="18.61 103.03 18.61 92.53 29.11 92.53 29.11 84.42 18.61 84.42 18.61 73.92 10.5 73.92 10.5 84.42 0 84.42 0 92.53 10.5 92.53 10.5 103.03 18.61 103.03"
            />
            <polygon
              fill="currentColor"
              points="10.5 0 10.5 64.73 18.57 64.73 18.57 8.08 185.63 8.08 185.63 175.1 149.8 175.1 149.8 183.18 193.7 183.18 193.7 0 10.5 0"
            />
          </svg>
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
                    ? 'bg-[#171717] text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#141414]'
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
                  ? 'bg-[#171717] text-white'
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