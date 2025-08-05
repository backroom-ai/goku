import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Eye, Trash2, Plus } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';

const ModelEditModal = ({ isOpen, onClose }) => {
  const { editingModel, updateModel, createModel, uploadPDF, loadModels } = useSettingsStore();
  const [formData, setFormData] = useState({
    model_name: '',
    display_name: '',
    provider: 'openai',
    enabled: false,
    default_temperature: 0.7,
    max_tokens: 4096,
    system_prompt: 'You are a helpful AI assistant.',
    api_endpoint: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingModel) {
      setFormData({
        model_name: editingModel.model_name || '',
        display_name: editingModel.display_name || '',
        provider: editingModel.provider || 'openai',
        enabled: editingModel.enabled || false,
        default_temperature: editingModel.default_temperature || 0.7,
        max_tokens: editingModel.max_tokens || 4096,
        system_prompt: editingModel.system_prompt || 'You are a helpful AI assistant.',
        api_endpoint: editingModel.api_endpoint || ''
      });
      setUploadedFiles(editingModel.uploaded_files || []);
    } else {
      setFormData({
        model_name: '',
        display_name: '',
        provider: 'openai',
        enabled: false,
        default_temperature: 0.7,
        max_tokens: 4096,
        system_prompt: 'You are a helpful AI assistant.',
        api_endpoint: ''
      });
      setUploadedFiles([]);
    }
    setSelectedFiles([]);
  }, [editingModel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingModel) {
        await updateModel(editingModel.id, formData);
      } else {
        await createModel(formData);
      }
      await loadModels(); // Refresh the models list
      onClose();
    } catch (error) {
      console.error('Failed to save model:', error);
      alert('Failed to save model. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleFileUpload = async () => {
    if (!selectedFiles.length) return;

    setUploading(true);
    try {
      const uploadResults = [];
      for (const file of selectedFiles) {
        if (file.type === 'application/pdf') {
          const result = await uploadPDF(editingModel?.id || 'temp', file);
          uploadResults.push({
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            ...result
          });
        }
      }
      setUploadedFiles([...uploadedFiles, ...uploadResults]);
      setSelectedFiles([]);
      // Reset file input
      const fileInput = document.getElementById('pdf-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const providers = [
    { value: 'openai', label: 'OpenAI', icon: '🤖' },
    { value: 'claude', label: 'Anthropic Claude', icon: '🧠' },
    { value: 'groq', label: 'Groq', icon: '⚡' },
    { value: 'ollama', label: 'Ollama', icon: '🏠' },
    { value: 'n8n', label: 'n8n Webhook', icon: '🔧' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingModel ? 'Edit Model' : 'Add New Model'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., gpt-4"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., GPT-4"
                required
              />
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.icon} {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* n8n Webhook URL */}
          {formData.provider === 'n8n' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://workflow.backroomop.com/webhook/..."
              />
            </div>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.default_temperature}
                onChange={(e) => setFormData({ ...formData, default_temperature: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="32000"
                value={formData.max_tokens}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="You are a helpful AI assistant."
            />
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                formData.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  formData.enabled ? 'translate-x-5' : 'translate-x-0'
                } mt-0.5 ml-0.5`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Enable this model
              </span>
            </label>
          </div>

          {/* PDF Upload for n8n */}
          {formData.provider === 'n8n' && editingModel && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Base</h3>
              
              {/* File Selection */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                  disabled={uploading}
                />
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="pdf-upload"
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Select PDFs
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Documents</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* File Header */}
                      <div className="flex items-center justify-between p-3 bg-gray-50">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-red-500 mr-2" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">{file.name}</span>
                            <div className="text-xs text-gray-500">
                              {file.size ? `${Math.round(file.size / 1024)} KB` : ''} • 
                              {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-red-600 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* PDF Viewer */}
                      {file.url && (
                        <div className="h-96 bg-gray-100">
                          <iframe
                            src={file.url}
                            className="w-full h-full border-0"
                            title={`PDF Viewer - ${file.name}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Instructions */}
              {uploadedFiles.length === 0 && selectedFiles.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No documents uploaded yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Select PDF files to upload to the knowledge base
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : (editingModel ? 'Update Model' : 'Create Model')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelEditModal;