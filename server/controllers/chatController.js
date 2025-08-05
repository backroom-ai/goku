import pool from '../config/database.js';
import { sendMessage } from '../utils/aiAdapters.js';

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
      `SELECT id, role, content, model_used, tokens_used, created_at 
       FROM messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    res.json({
      ...chatResult.rows[0],
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, modelName } = req.body;

    if (!content || !modelName) {
      return res.status(400).json({ error: 'Content and model name are required' });
    }

    // Verify chat belongs to user
    const chatResult = await pool.query(
      'SELECT id FROM chats WHERE id = $1 AND user_id = $2',
      [chatId, req.user.id]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Store user message
    const userMessageResult = await pool.query(
      `INSERT INTO messages (chat_id, role, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, created_at`,
      [chatId, 'user', content]
    );

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
      const response = await sendMessage(modelName, messages);

      // Store AI response
      const aiMessageResult = await pool.query(
        `INSERT INTO messages (chat_id, role, content, model_used, tokens_used) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, created_at`,
        [chatId, 'assistant', response.content, modelName, response.tokensUsed]
      );

      // Update chat timestamp
      await pool.query(
        'UPDATE chats SET updated_at = now() WHERE id = $1',
        [chatId]
      );

      res.json({
        userMessage: {
          id: userMessageResult.rows[0].id,
          role: 'user',
          content,
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