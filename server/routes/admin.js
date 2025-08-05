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
  updateApiKeys,
  getKnowledgeEntries,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/knowledge/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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

// Knowledge management
router.get('/knowledge', getKnowledgeEntries);
router.post('/knowledge', upload.single('file'), createKnowledgeEntry);
router.patch('/knowledge/:entryId', updateKnowledgeEntry);
router.delete('/knowledge/:entryId', deleteKnowledgeEntry);

export default router;