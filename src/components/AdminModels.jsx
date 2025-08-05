import React, { useState, useEffect } from 'react';
import { Bot, Settings, Eye, EyeOff, Save, Search, Filter, ToggleLeft as Toggle } from 'lucide-react';
import api from '../utils/api';

const AdminModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelsData = await api.getModelConfigs();
      setModels(modelsData);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateModel = async (modelId, updates) => {
    setSaving({ ...saving, [modelId]: true });
    try {
      const updatedModel = await api.updateModelConfig(modelId, updates);
      setModels(models.map(model => 
        model.id === modelId ? updatedModel : model
      ));
    } catch (error) {
      console.error('Failed to update model:', error);
    } finally {
      setSaving({ ...saving, [modelId]: false });
    }
  };

  const handleToggleEnabled = (modelId, enabled) => {
    const model = models.find(m => m.id === modelId);
    updateModel(modelId, { ...model, enabled });
  };

  const handleUpdateModel = (modelId, field, value) => {
    const model = models.find(m => m.id === modelId);
    const updates = { ...model, [field]: value };
    updateModel(modelId, updates);
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'enabled' && model.enabled) ||
                         (statusFilter === 'disabled' && !model.enabled);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Model Management</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Configure AI models and their availability to users
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Models</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50">
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <div key={provider} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {provider} Models
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {providerModels.map((model) => (
                <div key={model.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {model.display_name}
                      </h3>
                      <span className="ml-3 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full font-medium">
                        {model.model_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={model.enabled}
                          onChange={(e) => handleToggleEnabled(model.id, e.target.checked)}
                          disabled={saving[model.id]}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                          model.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        } ${saving[model.id] ? 'opacity-50' : ''}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            model.enabled ? 'translate-x-5' : 'translate-x-0'
                          } mt-0.5 ml-0.5`}></div>
                        </div>
                        <span className={`ml-3 text-sm font-medium ${
                          model.enabled ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {model.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={model.display_name}
                        onChange={(e) => handleUpdateModel(model.id, 'display_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={model.model_name}
                        onChange={(e) => handleUpdateModel(model.id, 'model_name', e.target.value)}
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Temperature
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={model.default_temperature}
                        onChange={(e) => handleUpdateModel(model.id, 'default_temperature', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={model.max_tokens}
                        onChange={(e) => handleUpdateModel(model.id, 'max_tokens', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {model.provider === 'n8n' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          API Endpoint
                        </label>
                        <input
                          type="url"
                          value={model.api_endpoint || ''}
                          onChange={(e) => handleUpdateModel(model.id, 'api_endpoint', e.target.value)}
                          placeholder="https://your-n8n-webhook-url"
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System Prompt
                      </label>
                      <textarea
                        value={model.system_prompt}
                        onChange={(e) => handleUpdateModel(model.id, 'system_prompt', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter default system prompt for this model..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(groupedModels).length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {models.length === 0 ? 'No models found' : 'No matching models'}
            </h3>
            <p className="text-gray-500">
              {models.length === 0 
                ? 'Models will appear here when they are configured' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModels;