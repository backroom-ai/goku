import pool from '../config/database.js';

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_at = now() 
       WHERE id = $2 
       RETURNING id, email, first_name, last_name, role`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllChats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              u.email as user_email, u.first_name, u.last_name,
              COUNT(m.id) as message_count
       FROM chats c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN messages m ON c.id = m.chat_id
       GROUP BY c.id, c.title, c.created_at, c.updated_at, u.email, u.first_name, u.last_name
       ORDER BY c.updated_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get all chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getModelConfigs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM model_configs 
       ORDER BY provider, display_name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get model configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateModelConfig = async (req, res) => {
  try {
    const { modelId } = req.params;
    const { 
      enabled, 
      default_temperature, 
      max_tokens, 
      system_prompt, 
      api_endpoint 
    } = req.body;

    const result = await pool.query(
      `UPDATE model_configs 
       SET enabled = $1, 
           default_temperature = $2, 
           max_tokens = $3, 
           system_prompt = $4, 
           api_endpoint = $5, 
           updated_at = now()
       WHERE id = $6 
       RETURNING *`,
      [enabled, default_temperature, max_tokens, system_prompt, api_endpoint, modelId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update model config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPromptTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pt.*, u.email as created_by_email 
       FROM prompt_templates pt
       JOIN users u ON pt.created_by = u.id
       ORDER BY pt.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get prompt templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPromptTemplate = async (req, res) => {
  try {
    const { name, content, description } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO prompt_templates (name, content, description, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, content, description, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create prompt template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePromptTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const result = await pool.query(
      'DELETE FROM prompt_templates WHERE id = $1 RETURNING id',
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete prompt template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};