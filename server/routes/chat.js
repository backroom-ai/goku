import express from 'express';
import multer from 'multer';
import { 
  getChats, 
  createChat, 
  getChat, 
  sendChatMessage, 
  updateChatTitle,
  deleteChat,
  getEnabledModels,
  deleteMessage
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer to accept any file field name
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  }
});

// All routes require authentication
router.use(authenticateToken);

router.get('/', getChats);
router.post('/', createChat);
router.get('/models', getEnabledModels);
router.get('/:chatId', getChat);
router.post('/:chatId/message', upload.any(), sendChatMessage);
router.patch('/:chatId/title', updateChatTitle);
router.delete('/:chatId', deleteChat);
router.delete('/message/:messageId', deleteMessage);

export default router;