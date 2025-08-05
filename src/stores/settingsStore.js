import { create } from 'zustand';
import api from '../utils/api';

const useSettingsStore = create((set, get) => ({
  // Users state
  users: [],
  usersLoading: false,
  
  // Models state
  models: [],
  modelsLoading: false,
  modelFilter: 'all', // 'all' | 'enabled' | 'disabled'
  editingModel: null,
  showModelModal: false,
  
  // API Keys state
  apiKeys: {},
  apiKeysLoading: false,
  
  // Actions
  loadUsers: async () => {
    set({ usersLoading: true });
    try {
      const users = await api.getUsers();
      set({ users, usersLoading: false });
    } catch (error) {
      console.error('Failed to load users:', error);
      set({ usersLoading: false });
    }
  },
  
  createUser: async (userData) => {
    try {
      const newUser = await api.createUser(userData);
      set(state => ({ users: [newUser, ...state.users] }));
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },
  
  updateUser: async (userId, updates) => {
    try {
      const updatedUser = await api.updateUser(userId, updates);
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? updatedUser : user
        )
      }));
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },
  
  updateUserRole: async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      set(state => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      }));
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  },
  
  loadModels: async () => {
    set({ modelsLoading: true });
    try {
      const models = await api.getModelConfigs();
      set({ models, modelsLoading: false });
    } catch (error) {
      console.error('Failed to load models:', error);
      set({ modelsLoading: false });
    }
  },
  
  updateModel: async (modelId, updates) => {
    try {
      const updatedModel = await api.updateModelConfig(modelId, updates);
      set(state => ({
        models: state.models.map(model => 
          model.id === modelId ? updatedModel : model
        )
      }));
      set({ showModelModal: false, editingModel: null });
      return updatedModel;
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  },

  createModel: async (modelData) => {
    try {
      const newModel = await api.createModelConfig(modelData);
      set(state => ({ models: [newModel, ...state.models] }));
      set({ showModelModal: false, editingModel: null });
      return newModel;
    } catch (error) {
      console.error('Failed to create model:', error);
      throw error;
    }
  },
  
  toggleModel: async (modelId, enabled) => {
    const model = get().models.find(m => m.id === modelId);
    if (model) {
      await get().updateModel(modelId, { ...model, enabled });
    }
  },
  
  setModelFilter: (filter) => {
    set({ modelFilter: filter });
  },
  
  getFilteredModels: () => {
    const { models, modelFilter } = get();
    switch (modelFilter) {
      case 'enabled':
        return models.filter(model => model.enabled);
      case 'disabled':
        return models.filter(model => !model.enabled);
      default:
        return models;
    }
  },

  setEditingModel: (model) => {
    set({ editingModel: model, showModelModal: true });
  },

  setShowModelModal: (show) => {
    set({ showModelModal: show, editingModel: show ? get().editingModel : null });
  },

  uploadPDF: async (modelId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to n8n webhook
      const webhookResponse = await fetch('https://workflow.backroomop.com/webhook-test/file-uploads', {
        method: 'POST',
        body: formData
      });
      
      if (!webhookResponse.ok) {
        throw new Error('Failed to upload to webhook');
      }
      
      // Also save to our backend if needed
      const response = await api.uploadPDF(formData);
      
      return response;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      throw error;
    }
  },
  
  loadApiKeys: async () => {
    set({ apiKeysLoading: true });
    try {
      const apiKeys = await api.getApiKeys();
      set({ apiKeys, apiKeysLoading: false });
    } catch (error) {
      console.error('Failed to load API keys:', error);
      set({ apiKeysLoading: false });
    }
  },
  
  updateApiKeys: async (keys) => {
    try {
      await api.updateApiKeys(keys);
      set({ apiKeys: keys });
    } catch (error) {
      console.error('Failed to update API keys:', error);
      throw error;
    }
  }
}));

export default useSettingsStore;