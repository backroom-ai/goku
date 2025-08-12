import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

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
    const result = await pool.query(`
      SELECT mc.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', kb.id,
                   'region_code', kb.region_code,
                   'region_name', kb.region_name,
                   'webhook_url', kb.webhook_url,
                   'is_active', kb.is_active
                 ) ORDER BY kb.region_code
               ) FILTER (WHERE kb.id IS NOT NULL), 
               '[]'::json
             ) as knowledge_bases
      FROM model_configs mc
      LEFT JOIN knowledge_bases kb ON mc.id = kb.model_id
      GROUP BY mc.id
      ORDER BY 
        CASE WHEN mc.model_name = 'goku-saiyan-1' THEN 0 ELSE 1 END,
        mc.provider, 
        mc.display_name
    `);

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
      model_name,
      display_name,
      enabled, 
      default_temperature, 
      max_tokens, 
      system_prompt, 
      api_endpoint 
    } = req.body;

    // Prevent deletion of Goku model
    const modelCheck = await pool.query(
      'SELECT model_name FROM model_configs WHERE id = $1',
      [modelId]
    );

    if (modelCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    const modelName = modelCheck.rows[0].model_name;
    if (modelName === 'goku-saiyan-1' && enabled === false) {
      return res.status(400).json({ error: 'Goku model cannot be disabled' });
    }

    const result = await pool.query(
      `UPDATE model_configs 
       SET model_name = $1,
           display_name = $2,
           enabled = $3, 
           default_temperature = $4, 
           max_tokens = $5, 
           system_prompt = $6, 
           api_endpoint = $7, 
           updated_at = now()
       WHERE id = $8 
       RETURNING *`,
      [model_name, display_name, enabled, default_temperature, max_tokens, system_prompt, api_endpoint, modelId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Update model config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteModelConfig = async (req, res) => {
  try {
    const { modelId } = req.params;

    // Prevent deletion of Goku model
    const modelCheck = await pool.query(
      'SELECT model_name FROM model_configs WHERE id = $1',
      [modelId]
    );

    if (modelCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    const modelName = modelCheck.rows[0].model_name;
    if (modelName === 'goku-saiyan-1') {
      return res.status(400).json({ error: 'Goku model cannot be deleted' });
    }

    const result = await pool.query(
      'DELETE FROM model_configs WHERE id = $1 RETURNING id',
      [modelId]
    );

    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Delete model config error:', error);
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

export const uploadPDFs = async (req, res) => {
  try {
    const { modelId, regionCode } = req.body;
    const files = req.files;

    if (!files || files.length === 0 || !modelId) {
      return res.status(400).json({ error: 'Files, model ID, and region code are required' });
    }

    // Get knowledge base for the region
    let knowledgeBaseId = null;
    let webhookUrl = null;
    if (regionCode) {
      const kbResult = await pool.query(
        'SELECT id, webhook_url FROM knowledge_bases WHERE model_id = $1 AND region_code = $2',
        [modelId, regionCode]
      );
      
      if (kbResult.rows.length > 0) {
        knowledgeBaseId = kbResult.rows[0].id;
        webhookUrl = kbResult.rows[0].webhook_url;
      }
    }

    await ensureUploadsDir();
    
    const uploadedFiles = [];

    // Process and save each file
    for (const file of files) {
      if (!file.originalname || !file.buffer) {
        console.warn('Skipping invalid file:', file);
        continue;
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}_${randomSuffix}_${file.originalname}`;
      const filePath = path.join(uploadsDir, filename);
      const relativePath = `/uploads/${filename}`;
      
      await fs.writeFile(filePath, file.buffer);
      
      let result;
      if (knowledgeBaseId) {
        // Store in knowledge_base_uploads for regional uploads
        result = await pool.query(
          `INSERT INTO knowledge_base_uploads (knowledge_base_id, user_id, filename, original_name, file_type, file_size, file_path) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [knowledgeBaseId, req.user.id, filename, file.originalname, file.mimetype, file.size, relativePath]
        );
      } else {
        // Store in uploads for general model uploads
        result = await pool.query(
          `INSERT INTO uploads (user_id, model_id, filename, original_name, file_type, file_size, file_path) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING *`,
          [req.user.id, modelId, filename, file.originalname, file.mimetype, file.size, relativePath]
        );
      }
      
      uploadedFiles.push({
        id: result.rows[0].id,
        name: file.originalname,
        filename: filename,
        size: file.size,
        type: file.mimetype,
        url: `${req.protocol}://${req.get('host')}${relativePath}`,
        uploadedAt: result.rows[0].created_at,
        buffer: file.buffer // Keep buffer for webhook
      });
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No valid files were processed' });
    }

    // Send files to appropriate webhook (regional or general)
    const targetWebhookUrl = webhookUrl || 'https://workflow.backroomop.com/webhook-test/file-uploads';
    
    try {
      const formData = new FormData();
      
      // Add metadata
      formData.append('modelId', modelId);
      if (regionCode) {
        formData.append('regionCode', regionCode);
        formData.append('regionName', getRegionName(regionCode));
      }
      formData.append('uploadCount', uploadedFiles.length.toString());
      formData.append('timestamp', new Date().toISOString());
      
      // Add each file by converting Buffer to Blob
      uploadedFiles.forEach((file, index) => {
        // Convert Buffer to Blob
        const blob = new Blob([file.buffer], { type: file.type });
        
        formData.append(`file_${index}`, blob, file.name);
        formData.append(`metadata_${index}`, JSON.stringify({
          id: file.id,
          filename: file.name,
          size: file.size,
          type: file.type
        }));
      });
      
      console.log(`Sending ${uploadedFiles.length} files to ${regionCode ? `${regionCode} regional` : 'general'} webhook: ${targetWebhookUrl}`);
      
      const response = await fetch(targetWebhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'TBridge-Server/1.0'
          // Don't set Content-Type header - let browser set it with boundary
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`${regionCode ? `${regionCode} regional` : 'General'} webhook notification failed (${response.status}): ${errorText}`);
      } else {
        console.log(`${regionCode ? `${regionCode} regional` : 'General'} webhook notification sent successfully`);
      }
    } catch (webhookError) {
      console.error(`${regionCode ? `${regionCode} regional` : 'General'} webhook notification error:`, webhookError);
    }
    
    // Clean up buffer from response (don't send large buffers back to client)
    const responseFiles = uploadedFiles.map(({buffer, ...file}) => file);
    
    res.json({
      message: `${uploadedFiles.length} PDF(s) uploaded successfully${regionCode ? ` to ${regionCode} knowledge base` : ''}`,
      files: responseFiles,
      modelId: modelId,
      regionCode: regionCode || null,
      webhookUrl: targetWebhookUrl
    });
  } catch (error) {
    console.error('Upload PDFs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get region name from code
const getRegionName = (regionCode) => {
  const regionNames = {
    'NZ': 'New Zealand',
    'AU': 'Australia', 
    'UK': 'United Kingdom',
    'US': 'United States'
  };
  return regionNames[regionCode] || regionCode;
};
export const getModelUploads = async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const result = await pool.query(
      `SELECT id, filename, original_name, file_type, file_size, file_path, created_at
       FROM uploads 
       WHERE model_id = $1 
       ORDER BY created_at DESC`,
      [modelId]
    );
    
    const files = result.rows.map(file => ({
      id: file.id,
      name: file.original_name,
      filename: file.filename,
      size: file.file_size,
      type: file.file_type,
      url: `${req.protocol}://${req.get('host')}${file.file_path}`,
      uploadedAt: file.created_at
    }));
    
    res.json(files);
  } catch (error) {
    console.error('Get model uploads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUpload = async (req, res) => {
  try {
    const { uploadId } = req.params;
    
    // Get file info before deletion
    const fileResult = await pool.query(
      'SELECT filename, file_path FROM uploads WHERE id = $1',
      [uploadId]
    );
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Delete from database
    await pool.query('DELETE FROM uploads WHERE id = $1', [uploadId]);
    
    // Delete physical file
    try {
      const filePath = path.join(__dirname, '..', file.file_path);
      await fs.unlink(filePath);
    } catch (fsError) {
      console.warn('Failed to delete physical file:', fsError);
      // Continue - database record is deleted
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
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