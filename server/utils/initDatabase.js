import pool from '../config/database.js';
import bcrypt from 'bcrypt';

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database schema...');

    // Create tables
    await createTables();
    
    // Create indexes
    await createIndexes();
    
    // Insert default data
    await insertDefaultData();
    
    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const createTables = async () => {
  const createTablesSQL = `
    -- Users table for authentication and role management
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      first_name text,
      last_name text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Chats table for organizing conversations
    CREATE TABLE IF NOT EXISTS chats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT 'New Chat',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Messages table for storing chat messages
    CREATE TABLE IF NOT EXISTS messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content text NOT NULL,
      model_used text,
      tokens_used integer DEFAULT 0,
      attachments jsonb DEFAULT '[]'::jsonb,
      created_at timestamptz DEFAULT now()
    );

    -- Prompt templates for reusable prompts (admin feature)
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      content text NOT NULL,
      description text,
      created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Model configurations for AI providers
    CREATE TABLE IF NOT EXISTS model_configs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      model_name text UNIQUE NOT NULL,
      display_name text NOT NULL,
      provider text NOT NULL CHECK (provider IN ('openai', 'claude', 'groq', 'ollama', 'n8n')),
      enabled boolean DEFAULT false,
      default_temperature decimal(3,2) DEFAULT 0.7,
      max_tokens integer DEFAULT 2048,
      system_prompt text DEFAULT 'You are a helpful AI assistant.',
      api_endpoint text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- File uploads tracking
    CREATE TABLE IF NOT EXISTS uploads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      model_id uuid REFERENCES model_configs(id) ON DELETE CASCADE,
      filename text NOT NULL,
      original_name text NOT NULL,
      file_type text NOT NULL,
      file_size integer NOT NULL,
      file_path text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    -- API Keys storage
    CREATE TABLE IF NOT EXISTS api_keys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      key_name text UNIQUE NOT NULL,
      key_value text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `;

  await pool.query(createTablesSQL);
  console.log('✅ Tables created successfully');
};

const createIndexes = async () => {
  const createIndexesSQL = `
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
    CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages USING gin(attachments);
    CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
    CREATE INDEX IF NOT EXISTS idx_model_configs_enabled ON model_configs(enabled);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_prompt_templates_created_by ON prompt_templates(created_by);
    CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);
  `;

  await pool.query(createIndexesSQL);
  console.log('✅ Indexes created successfully');
};

const insertDefaultData = async () => {
  // Check if admin user already exists
  const adminCheck = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['admin@example.com']
  );

  if (adminCheck.rows.length === 0) {
    // Create default admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      ['admin@example.com', passwordHash, 'admin', 'Admin', 'User']
    );

    const adminUserId = adminResult.rows[0].id;
    console.log('✅ Default admin user created');

    // Insert default model configurations
    const modelConfigsCheck = await pool.query('SELECT COUNT(*) FROM model_configs');
    
    if (parseInt(modelConfigsCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO model_configs (model_name, display_name, provider, enabled, default_temperature, max_tokens, system_prompt) VALUES
        ('gpt-4.1-mini', 'GPT-4', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('claude-3-opus', 'Claude 3 Opus', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('claude-3-sonnet', 'Claude 3 Sonnet', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('claude-3-haiku', 'Claude 3 Haiku', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('groq-llama2-70b', 'Llama 2 70B (Groq)', 'groq', false, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('groq-mixtral-8x7b', 'Mixtral 8x7B (Groq)', 'groq', false, 0.7, 4096, 'You are a helpful AI assistant.'),
        ('ollama-llama3.1:latest', 'Llama 2 (Local)', 'ollama', false, 0.7, 2048, 'You are a helpful AI assistant.'),
        ('n8n-webhook', 'Goku Saiyan 1', 'n8n', false, 0.7, 2048, 'You are a helpful AI assistant.')
      `);
      console.log('✅ Default model configurations created');
    }
    // ('openai-gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
    // Insert sample prompt templates
    const templatesCheck = await pool.query('SELECT COUNT(*) FROM prompt_templates');
    
    if (parseInt(templatesCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO prompt_templates (name, content, description, created_by) VALUES
        ($1, $2, $3, $4),
        ($5, $6, $7, $4),
        ($8, $9, $10, $4),
        ($11, $12, $13, $4)
      `, [
        'Code Review',
        'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Security considerations\n\nCode:\n```\n[PASTE CODE HERE]\n```',
        'Template for code review requests',
        adminUserId,
        'Technical Documentation',
        'Create comprehensive technical documentation for the following:\n\n[DESCRIBE WHAT TO DOCUMENT]\n\nPlease include:\n- Overview and purpose\n- Installation/setup instructions\n- Usage examples\n- API reference (if applicable)\n- Troubleshooting guide',
        'Template for generating technical documentation',
        'Bug Report Analysis',
        'Analyze this bug report and provide:\n1. Root cause analysis\n2. Potential solutions\n3. Prevention strategies\n4. Testing recommendations\n\nBug Report:\n[PASTE BUG REPORT HERE]',
        'Template for analyzing bug reports',
        'Meeting Summary',
        'Please create a structured summary of this meeting:\n\n[PASTE MEETING NOTES/TRANSCRIPT]\n\nInclude:\n- Key decisions made\n- Action items with owners\n- Important discussion points\n- Next steps',
        'Template for meeting summaries'
      ]);
      console.log('✅ Default prompt templates created');
    }

    // Create a sample chat for the admin user
    const chatCheck = await pool.query(
      'SELECT COUNT(*) FROM chats WHERE user_id = $1',
      [adminUserId]
    );

    if (parseInt(chatCheck.rows[0].count) === 0) {
      const chatResult = await pool.query(
        `INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id`,
        [adminUserId, 'Welcome to Open WebUI']
      );

      const chatId = chatResult.rows[0].id;

      await pool.query(
        `INSERT INTO messages (chat_id, role, content, model_used, tokens_used) VALUES ($1, $2, $3, $4, $5)`,
        [
          chatId,
          'assistant',
          'Welcome to Open WebUI! I\'m here to help you with any questions or tasks you might have. As an admin, you have access to:\n\n• User management\n• Model configuration\n• Prompt templates\n• System settings\n\nFeel free to ask me anything!',
          'gpt-4.1-mini',
          45
        ]
      );
      console.log('✅ Sample chat created for admin user');
    }
  } else {
    console.log('✅ Admin user already exists, skipping creation');
  }
};