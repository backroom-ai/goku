import React, { useState } from 'react';
import { Users, Bot, Key, FileText } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminModels from './AdminModels';
import AdminApiKeys from './AdminApiKeys';
import AdminKnowledge from './AdminKnowledge';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', name: 'Users', icon: Users },
    { id: 'models', name: 'Models', icon: Bot },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'knowledge', name: 'Knowledge', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminUsers />;
      case 'models':
        return <AdminModels />;
      case 'api-keys':
        return <AdminApiKeys />;
      case 'knowledge':
        return <AdminKnowledge />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="flex h-full transition-all duration-300 ease-in-out">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your TBridge configuration</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
      <div className="flex-1 overflow-hidden transition-all duration-300 ease-in-out">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings;