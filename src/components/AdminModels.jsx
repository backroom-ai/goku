import React, { useState, useEffect } from 'react';
import { Bot, Settings, Eye, EyeOff, Save } from 'lucide-react';
import api from '../utils/api';

const AdminModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center">
          <Bot className="w-6 h-6 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold text-white">Model Management</h1>
        </div>
        <p className="text-gray-400 mt-2">
          Configure AI models and their availability to users
        </p>
      </div>

      {/* Models */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <div key={provider} className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white capitalize">
                {provider} Models
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {providerModels.map((model) => (
                <div key={model.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-white">
                        {model.display_name}
                      </h3>
                      <span className="ml-3 px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                        {model.model_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleEnabled(model.id, !model.enabled)}
                        disabled={saving[model.id]}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          model.enabled
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        } ${saving[model.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {model.enabled ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Disabled
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Temperature
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={model.default_temperature}
                        onChange={(e) => handleUpdateModel(model.id, 'default_temperature', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={model.max_tokens}
                        onChange={(e) => handleUpdateModel(model.id, 'max_tokens', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {model.provider === 'n8n' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          API Endpoint
                        </label>
                        <input
                          type="url"
                          value={model.api_endpoint || ''}
                          onChange={(e) => handleUpdateModel(model.id, 'api_endpoint', e.target.value)}
                          placeholder="https://your-n8n-webhook-url"
                          className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        System Prompt
                      </label>
                      <textarea
                        value={model.system_prompt}
                        onChange={(e) => handleUpdateModel(model.id, 'system_prompt', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-600 text-white border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter default system prompt for this model..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminModels;