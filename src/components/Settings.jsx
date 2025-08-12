import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Users, Bot, Key } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminModels from './AdminModels';
import AdminApiKeys from './AdminApiKeys';

const Settings = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'models', name: 'Models', icon: Bot },
    { id: 'api-keys', name: 'API Keys', icon: Key },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers />;
      case 'models':
        return <AdminModels />;
      case 'api-keys':
        return <AdminApiKeys />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-dark-100">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-dark-400 mt-1">Manage your TBridge configuration</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings;