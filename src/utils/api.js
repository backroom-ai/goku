const API_BASE_URL = 'http://localhost:3001/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(email, password, firstName, lastName) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Chat methods
  async getChats() {
    return this.request('/chat');
  }

  async createChat(title) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getChat(chatId) {
    return this.request(`/chat/${chatId}`);
  }

  async sendMessage(chatId, content, modelName, files = []) {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('modelName', modelName);
    
    // Add files to FormData
    files.forEach((fileObj, index) => {
      formData.append('files', fileObj.file);
      formData.append(`fileMetadata_${index}`, JSON.stringify({
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type
      }));
    });
    
    formData.append('fileCount', files.length.toString());

    return this.request(`/chat/${chatId}/message`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      }
    });
  }

  async deleteChat(chatId) {
    return this.request(`/chat/${chatId}`, {
      method: 'DELETE',
    });
  }

  async getEnabledModels() {
    return this.request('/chat/models');
  }

  // Admin methods
  async getUsers() {
    return this.request('/admin/users');
  }

  async createUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, updates) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async updateUserRole(userId, role) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async getAllChats() {
    return this.request('/admin/chats');
  }

  async getModelConfigs() {
    return this.request('/admin/models');
  }

  async updateModelConfig(modelId, config) {
    return this.request(`/admin/models/${modelId}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  async createModelConfig(config) {
    return this.request('/admin/models', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateChatTitle(chatId, title) {
    return this.request(`/chat/${chatId}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  async uploadPDFs(formData) {
    return this.request('/admin/upload-pdfs', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
      }
    });
  }

  async getModelUploads(modelId) {
    return this.request(`/admin/models/${modelId}/uploads`);
  }

  async deleteUpload(uploadId) {
    return this.request(`/admin/uploads/${uploadId}`, {
      method: 'DELETE'
    });
  }
  
  async getPromptTemplates() {
    return this.request('/admin/templates');
  }

  async createPromptTemplate(name, content, description) {
    return this.request('/admin/templates', {
      method: 'POST',
      body: JSON.stringify({ name, content, description }),
    });
  }

  async deletePromptTemplate(templateId) {
    return this.request(`/admin/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // API Keys methods
  async getApiKeys() {
    return this.request('/admin/api-keys');
  }

  async updateApiKeys(keys) {
    return this.request('/admin/api-keys', {
      method: 'PUT',
      body: JSON.stringify(keys),
    });
  }
  logout() {
    this.setToken(null);
  }
}

export default new APIClient();