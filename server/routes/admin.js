import express from 'express';
import multer from 'multer';
import { 
  getUsers, 
  createUser,
  updateUser,
  updateUserRole, 
  getAllChats,
  getModelConfigs,
  updateModelConfig,
  createModelConfig,
  uploadPDF,
  getPromptTemplates,
  createPromptTemplate,
  deletePromptTemplate,
  getApiKeys,
  updateApiKeys
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/models', createModelConfig);
router.patch('/models/:modelId', updateModelConfig);

// File upload
router.post('/upload-pdfs', upload.array('files', 10), uploadPDFs);
router.get('/models/:modelId/uploads', getModelUploads);
router.delete('/uploads/:uploadId', deleteUpload);

// Prompt templates
router.get('/templates', getPromptTemplates);
router.post('/templates', createPromptTemplate);
router.delete('/templates/:templateId', deletePromptTemplate);

// API Keys management
router.get('/api-keys', getApiKeys);
router.put('/api-keys', updateApiKeys);
export default router;