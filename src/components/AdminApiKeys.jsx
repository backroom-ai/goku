import React, { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const AdminApiKeys = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    groq: '',
    ollama: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  const keyConfigs = [
    {
      key: 'openai',
      label: 'OpenAI API Key',
      description: 'Required for GPT models',
      placeholder: 'sk-...',
      icon: '🤖'
    },
    {
      key: 'claude',
      label: 'Anthropic API Key',
      description: 'Required for Claude models',
      placeholder: 'sk-ant-...',
      icon: '🧠'
    },
    {
      key: 'groq',
      label: 'Groq API Key',
      description: 'Required for Groq models',
      placeholder: 'gsk_...',
      icon: '⚡'
    },
    {
      key: 'ollama',
      label: 'Ollama URL',
      description: 'Local Ollama server endpoint',
      placeholder: 'http://localhost:11434',
      icon: '🏠'
    }
  ];

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await api.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('');
    
    try {
      await api.updateApiKeys(apiKeys);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (keyName) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const handleKeyChange = (keyName, value) => {
    setApiKeys(prev => ({
      ...prev,
      [keyName]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-[#121212] bg-white dark:bg-[#171717]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Key className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure API keys for AI service integrations
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#171717] text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#171717]">
        <div className="max-w-4xl mx-auto">
          {/* Status Message */}
          {saveStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              saveStatus === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {saveStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {saveStatus === 'success'
                  ? 'API keys saved successfully!'
                  : 'Failed to save API keys. Please try again.'
                }
              </div>
            </div>
          )}

          {/* API Keys Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {keyConfigs.map((config) => (
              <div key={config.key} className="bg-white dark:bg-[#0d0d0d] rounded-lg border border-gray-200 dark:border-[#121212] p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{config.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {config.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showKeys[config.key] ? 'text' : 'password'}
                    value={apiKeys[config.key] || ''}
                    onChange={(e) => handleKeyChange(config.key, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-[#141414] text-gray-900 dark:text-white rounded-lg focus:outline-none font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(config.key)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showKeys[config.key] ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Status indicator */}
                <div className="mt-3 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    apiKeys[config.key] ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    apiKeys[config.key] ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {apiKeys[config.key] ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApiKeys;