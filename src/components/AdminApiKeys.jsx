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
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Key className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
              <p className="text-gray-600 mt-1">
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
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
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
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
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
              <div key={config.key} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{config.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {config.label}
                    </h3>
                    <p className="text-sm text-gray-600">
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
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(config.key)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    apiKeys[config.key] ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {apiKeys[config.key] ? 'Configured' : 'Not configured'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Security Notice
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• API keys are encrypted and stored securely in the database</li>
                  <li>• Keys are only accessible to admin users</li>
                  <li>• Never share your API keys with unauthorized users</li>
                  <li>• Regularly rotate your API keys for enhanced security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminApiKeys;