import express from 'express';
import { 
  getUsers, 
  createUser,
  updateUser,
  updateUserRole, 
  getAllChats,
  getModelConfigs,
  updateModelConfig,
  getPromptTemplates,
  createPromptTemplate,
  deletePromptTemplate,
  getApiKeys,
  updateApiKeys
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:userId', updateUser);
router.patch('/users/:userId/role', updateUserRole);

// Chat management
router.get('/chats', getAllChats);

// Model configuration
router.get('/models', getModelConfigs);
router.patch('/models/:modelId', updateModelConfig);

// Prompt templates
router.get('/templates', getPromptTemplates);
router.post('/templates', createPromptTemplate);
router.delete('/templates/:templateId', deletePromptTemplate);

// API Keys management
router.get('/api-keys', getApiKeys);
router.put('/api-keys', updateApiKeys);
export default router;