import express from 'express';
import { 
  getChats, 
  createChat, 
  getChat, 
  sendChatMessage, 
  deleteChat,
  getEnabledModels
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getChats);
router.post('/', createChat);
router.get('/models', getEnabledModels);
router.get('/:chatId', getChat);
router.post('/:chatId/message', sendChatMessage);
router.delete('/:chatId', deleteChat);

export default router;