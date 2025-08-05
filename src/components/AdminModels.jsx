import React, { useState, useEffect } from 'react';
import { Bot, Search, Filter, Edit3, Plus, Save, X } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';

const AdminModels = () => {
  const { 
    models, 
    modelsLoading, 
    modelFilter, 
    loadModels, 
    updateModel, 
    toggleModel, 
    setModelFilter, 
    getFilteredModels 
  } = useSettingsStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editingModel, setEditingModel] = useState(null);
  const [editForm, setEditForm] = useState({ display_name: '', model_name: '' });

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, []);

  const handleToggleEnabled = (modelId, enabled) => {
    toggleModel(modelId, enabled);
  };

  const filteredModels = getFilteredModels().filter(model => {
    const matchesSearch = model.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getModelIcon = (provider) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'claude': return '🧠';
      case 'groq': return '⚡';
      case 'ollama': return '🏠';
      default: return '🔧';
    }
  };

  const handleEditModel = (model) => {
    setEditingModel(model.id);
    setEditForm({
      display_name: model.display_name,
      model_name: model.model_name
    });
  };

  const handleSaveEdit = async () => {
    try {
      const model = models.find(m => m.id === editingModel);
      await updateModel(editingModel, { ...model, ...editForm });
      setEditingModel(null);
      setEditForm({ display_name: '', model_name: '' });
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setEditForm({ display_name: '', model_name: '' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Models</h1>
              <p className="text-gray-600 mt-1">Configure AI models and their availability</p>
            </div>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
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
          
          {/* Filter Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all', 'enabled', 'disabled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setModelFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                  modelFilter === filter
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="divide-y divide-gray-200">
            {filteredModels.map((model) => (
              <div key={model.id} className="p-6 hover:bg-gray-50 transition-colors">
                {editingModel === model.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        {getModelIcon(model.provider)}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={editForm.display_name}
                            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model Name/Tag
                          </label>
                          <input
                            type="text"
                            value={editForm.model_name}
                            onChange={(e) => setEditForm({ ...editForm, model_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Model Icon */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                        {getModelIcon(model.provider)}
                      </div>
                      
                      {/* Model Info */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {model.display_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {model.model_name} • {model.provider}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleEditModel(model)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={model.enabled}
                          onChange={(e) => handleToggleEnabled(model.id, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                          model.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                            model.enabled ? 'translate-x-5' : 'translate-x-0'
                          } mt-0.5 ml-0.5`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {filteredModels.length === 0 && (
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