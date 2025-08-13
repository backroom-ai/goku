import React, { useState, useEffect } from 'react';
import { Bot, Search, Filter, Edit3, Plus } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';
import ModelEditModal from './ModelEditModal';

const AdminModels = () => {
  const { 
    models, 
    modelsLoading, 
    modelFilter, 
    loadModels, 
    updateModel, 
    toggleModel, 
    setModelFilter, 
    getFilteredModels,
    setEditingModel,
    showModelModal,
    setShowModelModal
  } = useSettingsStore();
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
  }, []);

  const handleToggleEnabled = (modelId, enabled) => {
    toggleModel(modelId, enabled);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
  };

  const handleAddModel = () => {
    setEditingModel(null);
    setShowModelModal(true);
  };
  const filteredModels = getFilteredModels().filter(model => {
    const matchesSearch = (model.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.model_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.provider || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d0d0d] dark:border-white"></div>
      </div>
    );
  }

  const getModelIcon = (provider) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'claude': return '🧠';
      case 'groq': return '⚡';
      case 'ollama': return '🏠';
      case 'n8n': return '🔧';
      default: return '🔧';
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-[#171717]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-[#171717] dark:text-white mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Models</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Configure AI models and their availability</p>
            </div>
          </div>
          <button 
          onClick={handleAddModel}
          className="flex items-center px-4 py-2 bg-[#171717] text-white rounded-lg hover:bg-gray-500 dark:hover:bg-gray-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white dark:bg-[#171717]">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-transparent focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          {/* Filter Tabs */}
          <div className="flex bg-gray-100 dark:bg-[#0d0d0d] rounded-lg p-1">
            {['all', 'enabled', 'disabled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setModelFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                  modelFilter === filter
                    ? 'bg-white dark:bg-[#202020] text-[#0d0d0d] dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50 dark:bg-[#171717]">
        <div className="bg-white dark:bg-[#0d0d0d] rounded-lg shadow-sm">
          <div className="divide-y divide-gray-200 dark:divide-[#121212]">
            {filteredModels.map((model) => (
              <div key={model.id} className="p-6 hover:bg-gray-50 dark:hover:bg-[#121212] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Model Icon */}
                    <div className="w-12 h-12 bg-gray-100 dark:bg-[#171717] rounded-lg flex items-center justify-center text-xl">
                      {getModelIcon(model.provider)}
                    </div>
                    
                    {/* Model Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {model.display_name}
                        </h3>
                        {model.model_name === 'goku-saiyan-1' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {model.display_name}
                        {model.model_name} • {model.provider}
                      </p>
                      
                      {/* Show knowledge bases for Goku */}
                      {model.model_name === 'goku-saiyan-1' && model.knowledge_bases && model.knowledge_bases.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Regional Knowledge Bases:</p>
                          <div className="flex flex-wrap gap-1">
                            {model.knowledge_bases.map((kb) => (
                              <span key={kb.region_code} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                {kb.region_code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleEditModel(model)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={model.enabled}
                        onChange={(e) => {
                          if (model.model_name === 'goku-saiyan-1' && !e.target.checked) {
                            alert('Goku model cannot be disabled');
                            return;
                          }
                          handleToggleEnabled(model.id, e.target.checked);
                        }}
                        className="sr-only"
                        disabled={model.model_name === 'goku-saiyan-1' && model.enabled}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                        model.enabled ? 'bg-green-400' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          model.enabled ? 'translate-x-5' : 'translate-x-0'
                        } mt-0.5 ml-0.5`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {filteredModels.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#0d0d0d] rounded-lg border border-gray-200 dark:border-[#121212] shadow-sm">
            <Bot className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {models.length === 0 ? 'No models found' : 'No matching models'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {models.length === 0 
                ? 'Models will appear here when they are configured' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Model Edit Modal */}
      <ModelEditModal 
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
      />
    </>
  );
};

export default AdminModels;