import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, Upload, Type } from 'lucide-react';
import useSettingsStore from '../stores/settingsStore';

const AdminKnowledge = () => {
  const { 
    models, 
    loadModels,
    knowledgeEntries,
    knowledgeLoading,
    loadKnowledgeEntries,
    createKnowledgeEntry,
    updateKnowledgeEntry,
    deleteKnowledgeEntry
  } = useSettingsStore();
  
  const [selectedModel, setSelectedModel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [entryType, setEntryType] = useState('text');
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    file: null
  });
  const [editingEntry, setEditingEntry] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (models.length === 0) {
      loadModels();
    }
    loadKnowledgeEntries();
  }, []);

  const enabledModels = models.filter(model => model.enabled);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const formData = new FormData();
      formData.append('title', newEntry.title);
      formData.append('type', entryType);
      formData.append('model_id', selectedModel);
      
      if (entryType === 'text') {
        formData.append('content', newEntry.content);
      } else if (entryType === 'pdf' && newEntry.file) {
        formData.append('file', newEntry.file);
      }
      
      await createKnowledgeEntry(formData);
      setNewEntry({ title: '', content: '', file: null });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create knowledge entry:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this knowledge entry?')) {
      try {
        await deleteKnowledgeEntry(entryId);
      } catch (error) {
        console.error('Failed to delete knowledge entry:', error);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'text':
        return <Type className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  if (knowledgeLoading) {
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
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-gray-600 mt-1">Manage PDF documents and text snippets for AI context</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Knowledge Entry</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Associated Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a model</option>
                    {enabledModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entry Type
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="text">Text Snippet</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {entryType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newEntry.content}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your text content here..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF File
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF files only</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setNewEntry({ ...newEntry, file: e.target.files[0] })}
                        className="hidden"
                        required
                      />
                    </label>
                  </div>
                  {newEntry.file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {newEntry.file.name}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Entry
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Knowledge Entries */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="space-y-4">
          {knowledgeEntries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No knowledge entries found</h3>
              <p className="text-gray-500">Add PDF documents or text snippets to enhance AI responses</p>
            </div>
          ) : (
            <div className="space-y-4">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {entry.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="capitalize">{entry.type}</span>
                          <span>•</span>
                          <span>{entry.model_name}</span>
                          <span>•</span>
                          <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                        {entry.type === 'text' && entry.content && (
                          <div className="bg-gray-50 rounded-md p-3 mb-3">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {entry.content}
                            </p>
                          </div>
                        )}
                        {entry.type === 'pdf' && entry.file_path && (
                          <div className="bg-gray-50 rounded-md p-3 mb-3">
                            <p className="text-sm text-gray-700">
                              📄 {entry.original_filename || 'PDF Document'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingEntry(entry.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminKnowledge;