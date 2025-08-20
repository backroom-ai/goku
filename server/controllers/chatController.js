import pool from '../config/database.js';
import { sendMessage } from '../utils/aiAdapters.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads', 'chat-attachments');

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

export const getChats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at 
       FROM chats 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createChat = async (req, res) => {
  try {
    const { title = 'New Chat' } = req.body;

    const result = await pool.query(
      `INSERT INTO chats (user_id, title) 
       VALUES ($1, $2) 
       RETURNING id, title, created_at, updated_at`,
      [req.user.id, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Get chat details
    const chatResult = await pool.query(
      `SELECT id, title, created_at, updated_at 
       FROM chats 
       WHERE id = $1 AND user_id = $2`,
      [chatId, req.user.id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get messages
    const messagesResult = await pool.query(
      `SELECT id, role, content, model_used, tokens_used, attachments, created_at 
       FROM messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    // Parse attachments JSON for each message with proper error handling
    const messages = messagesResult.rows.map(msg => {
      let attachments = [];
      
      if (msg.attachments) {
        try {
          // Check if it's already an array (in case it's already parsed)
          if (Array.isArray(msg.attachments)) {
            attachments = msg.attachments;
          } else if (typeof msg.attachments === 'string' && msg.attachments.trim()) {
            attachments = JSON.parse(msg.attachments);
          }
        } catch (parseError) {
          console.warn(`Failed to parse attachments for message ${msg.id}:`, parseError.message);
          console.warn('Raw attachments data:', msg.attachments);
          attachments = [];
        }
      }
      
      return {
        ...msg,
        attachments: attachments
      };
    });

    res.json({
      ...chatResult.rows[0],
      messages: messages
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, modelName, fileCount } = req.body;
    const files = req.files || [];

    if ((!content || !content.trim()) && files.length === 0) {
      return res.status(400).json({ error: 'Content or files are required' });
    }

    if (!modelName) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    // Verify chat belongs to user
    const chatResult = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Process uploaded files
    let attachments = [];
    if (files.length > 0) {
      await ensureUploadsDir();
      
      files.forEach((file, index) => {
        const metadataKey = `fileMetadata_${index}`;
        let metadata = {};
        
        try {
          metadata = req.body[metadataKey] ? JSON.parse(req.body[metadataKey]) : {};
        } catch (e) {
          metadata = { name: file.originalname, size: file.size, type: file.mimetype };
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}_${randomSuffix}_${metadata.name || file.originalname}`;
        const filePath = path.join(uploadsDir, filename);
        
        // Save file to disk (we'll do this synchronously in the loop)
        attachments.push({
          file,
          metadata,
          filename,
          filePath
        });
      });
      
      // Save all files to disk
      for (const attachment of attachments) {
        await fs.writeFile(attachment.filePath, attachment.file.buffer);
      }
      
      // Process attachments for database storage
      attachments = attachments.map(attachment => ({
        name: attachment.metadata.name || attachment.file.originalname,
        size: attachment.metadata.size || attachment.file.size,
        type: attachment.metadata.type || attachment.file.mimetype,
        filename: attachment.filename,
        path: attachment.filePath
      }));
    }

    // Store user message
    const userMessageResult = await pool.query(
      `INSERT INTO messages (chat_id, role, content, attachments) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, created_at`,
      [chatId, 'user', content || '', JSON.stringify(attachments)]
    );

    // Check if request was aborted before proceeding to AI
    if (req.aborted) {
      console.log('Request aborted before AI processing');
      return res.status(499).json({ error: 'Request aborted' });
    }

    // Get chat history for context
    const historyResult = await pool.query(
      `SELECT role, content 
       FROM messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    const messages = historyResult.rows;

    try {
      // Send to AI
      const response = await sendMessage(modelName, messages, { attachments }, chatId);
      console.log('AI response:', modelName, chatId);
      
      // Check if request was aborted after AI response
      if (req.aborted || req.destroyed || req.socket?.destroyed) {
        console.log('Request aborted after AI response, not saving');
        return res.status(499).json({ error: 'Request aborted' });
      }
      
      // Store AI response
      const aiMessageResult = await pool.query(
        `INSERT INTO messages (chat_id, role, content, model_used, tokens_used) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, created_at`,
        [chatId, 'assistant', response.content, modelName, response.tokensUsed]
      );
      
      // Final check before sending response
      if (req.aborted || req.destroyed || req.socket?.destroyed) {
        console.log('Request aborted before sending response, deleting AI message');
        await pool.query('DELETE FROM messages WHERE id = $1', [aiMessageResult.rows[0].id]);
        return res.status(499).json({ error: 'Request aborted' });
      }
      
      // Update chat timestamp
      await pool.query(
        'UPDATE chats SET updated_at = now() WHERE id = $1',
        [chatId]
      );

      res.json({
        userMessage: {
          id: userMessageResult.rows[0].id,
          role: 'user',
          content: content || '',
          attachments: attachments,
          created_at: userMessageResult.rows[0].created_at
        },
        aiMessage: {
          id: aiMessageResult.rows[0].id,
          role: 'assistant',
          content: response.content,
          model_used: modelName,
          tokens_used: response.tokensUsed,
          created_at: aiMessageResult.rows[0].created_at
        }
      });
    } catch (aiError) {
      console.error('AI API error:', aiError);
      res.status(500).json({ 
        error: 'AI service error',
        details: aiError.message 
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateChatTitle = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Verify chat belongs to user
    const chatResult = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Update chat title
    const result = await pool.query(
      'UPDATE chats SET title = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [title.trim(), chatId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update chat title error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const result = await pool.query(
      'DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id',
      [chatId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEnabledModels = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT model_name, display_name, provider, default_temperature, max_tokens 
       FROM model_configs 
       WHERE enabled = true 
       ORDER BY display_name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Verify message exists and belongs to user's chat
    const messageResult = await pool.query(
      `SELECT m.id, c.user_id 
       FROM messages m
       JOIN chats c ON m.chat_id = c.id
       WHERE m.id = $1`,
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];
    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the message
    await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};