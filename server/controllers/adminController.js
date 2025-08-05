import bcrypt from 'bcrypt';
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

export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, firstName, lastName, role } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET email = COALESCE($1, email),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           role = COALESCE($4, role),
           updated_at = now()
       WHERE id = $5 
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, firstName, lastName, role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
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

export const createModelConfig = async (req, res) => {
  try {
    const { 
      model_name,
      display_name,
      provider,
      enabled = false,
      default_temperature = 0.7,
      max_tokens = 4096,
      system_prompt = 'You are a helpful AI assistant.',
      api_endpoint
    } = req.body;

    if (!model_name || !display_name || !provider) {
      return res.status(400).json({ error: 'Model name, display name, and provider are required' });
    }

    // Check if model already exists
    const existingModel = await pool.query(
      'SELECT id FROM model_configs WHERE model_name = $1',
      [model_name]
    );

    if (existingModel.rows.length > 0) {
      return res.status(400).json({ error: 'Model with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO model_configs (
        model_name, display_name, provider, enabled, 
        default_temperature, max_tokens, system_prompt, api_endpoint
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [model_name, display_name, provider, enabled, default_temperature, max_tokens, system_prompt, api_endpoint]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create model config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadPDF = async (req, res) => {
  try {
    const { modelId } = req.body;
    const file = req.file;

    if (!file || !modelId) {
      return res.status(400).json({ error: 'File and model ID are required' });
    }

    // Create FormData for webhook
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    
    const webhookResponse = await fetch('https://workflow.backroomop.com/webhook-test/file-uploads', {
      method: 'POST',
      body: formData
    });

    if (!webhookResponse.ok) {
      throw new Error('Failed to upload to n8n webhook');
    }

    // Store PDF metadata in database
    const filename = `${Date.now()}_${file.originalname}`;
    const filePath = `/uploads/${filename}`;
    
    const result = await pool.query(
      `INSERT INTO uploads (user_id, filename, original_name, file_type, file_size, file_path) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, filename, file.originalname, file.mimetype, file.size, filePath]
    );

    res.json({
      message: 'PDF uploaded successfully',
      pdf: {
        id: result.rows[0].id,
        name: file.originalname,
        size: file.size,
        uploadedAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
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

export const getApiKeys = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key_name, key_value FROM api_keys ORDER BY key_name'
    );

    const keys = {};
    result.rows.forEach(row => {
      keys[row.key_name] = row.key_value;
    });

    res.json(keys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApiKeys = async (req, res) => {
  try {
    const keys = req.body;

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Delete existing keys
      await pool.query('DELETE FROM api_keys');

      // Insert new keys
      for (const [keyName, keyValue] of Object.entries(keys)) {
        if (keyValue && keyValue.trim()) {
          await pool.query(
            'INSERT INTO api_keys (key_name, key_value) VALUES ($1, $2)',
            [keyName, keyValue.trim()]
          );
        }
      }

      await pool.query('COMMIT');
      res.json({ message: 'API keys updated successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};