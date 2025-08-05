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
  
  // API Keys state
  apiKeys: {},
  apiKeysLoading: false,
  
  // Knowledge state
  knowledgeEntries: [],
  knowledgeLoading: false,
  
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
      return updatedModel;
    } catch (error) {
      console.error('Failed to update model:', error);
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
  },
  
  loadKnowledgeEntries: async () => {
    set({ knowledgeLoading: true });
    try {
      const entries = await api.getKnowledgeEntries();
      set({ knowledgeEntries: entries, knowledgeLoading: false });
    } catch (error) {
      console.error('Failed to load knowledge entries:', error);
      set({ knowledgeLoading: false });
    }
  },
  
  createKnowledgeEntry: async (formData) => {
    try {
      const newEntry = await api.createKnowledgeEntry(formData);
      set(state => ({ knowledgeEntries: [newEntry, ...state.knowledgeEntries] }));
      return newEntry;
    } catch (error) {
      console.error('Failed to create knowledge entry:', error);
      throw error;
    }
  },
  
  updateKnowledgeEntry: async (entryId, updates) => {
    try {
      const updatedEntry = await api.updateKnowledgeEntry(entryId, updates);
      set(state => ({
        knowledgeEntries: state.knowledgeEntries.map(entry => 
          entry.id === entryId ? updatedEntry : entry
        )
      }));
      return updatedEntry;
    } catch (error) {
      console.error('Failed to update knowledge entry:', error);
      throw error;
    }
  },
  
  deleteKnowledgeEntry: async (entryId) => {
    try {
      await api.deleteKnowledgeEntry(entryId);
      set(state => ({
        knowledgeEntries: state.knowledgeEntries.filter(entry => entry.id !== entryId)
      }));
    } catch (error) {
      console.error('Failed to delete knowledge entry:', error);
      throw error;
    }
  }
}));

export default useSettingsStore;