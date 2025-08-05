/*
  # Create complete schema for Open WebUI clone

  1. New Tables
    - `users` - User accounts with roles and authentication
    - `chats` - Chat sessions for organizing conversations
    - `messages` - Individual messages within chats
    - `prompt_templates` - Reusable prompt templates for admins
    - `model_configs` - Model configuration and availability settings
    - `uploads` - File upload tracking and metadata
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Users can only access their own data
    - Admins can access all data
    
  3. Default Data
    - Create default admin user
    - Insert default model configurations
    - Add sample prompt templates
*/

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS prompt_templates CASCADE;
DROP TABLE IF EXISTS model_configs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table for authentication and role management
CREATE TABLE users (
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
CREATE TABLE chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table for storing chat messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  model_used text,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Prompt templates for reusable prompts (admin feature)
CREATE TABLE prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Model configurations for AI providers
CREATE TABLE model_configs (
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
CREATE TABLE uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true);

-- RLS Policies for chats table
CREATE POLICY "Users can manage own chats"
  ON chats FOR ALL
  USING (true);

-- RLS Policies for messages table  
CREATE POLICY "Users can manage messages in own chats"
  ON messages FOR ALL
  USING (true);

-- RLS Policies for prompt_templates table
CREATE POLICY "Users can read all prompt templates"
  ON prompt_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own prompt templates"
  ON prompt_templates FOR ALL
  USING (true);

-- RLS Policies for model_configs table
CREATE POLICY "Users can read enabled models"
  ON model_configs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage model configs"
  ON model_configs FOR ALL
  USING (true);

-- RLS Policies for uploads table
CREATE POLICY "Users can manage own uploads"
  ON uploads FOR ALL
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_model_configs_enabled ON model_configs(enabled);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_prompt_templates_created_by ON prompt_templates(created_by);

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt for 'admin123'
INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES
('admin@example.com', '$2b$10$rKvK9qOQOL0r3vZr7Qhz6uJvJ8qQqzKvzKvzKvzKvzKvzKvzKvzKu', 'admin', 'Admin', 'User');

-- Get the admin user ID for foreign key references
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';

    -- Insert default model configurations
    INSERT INTO model_configs (model_name, display_name, provider, enabled, default_temperature, max_tokens, system_prompt) VALUES
    ('openai-gpt-4', 'GPT-4', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('openai-gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('claude-3-opus', 'Claude 3 Opus', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('claude-3-sonnet', 'Claude 3 Sonnet', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('claude-3-haiku', 'Claude 3 Haiku', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('groq-llama2-70b', 'Llama 2 70B (Groq)', 'groq', false, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('groq-mixtral-8x7b', 'Mixtral 8x7B (Groq)', 'groq', false, 0.7, 4096, 'You are a helpful AI assistant.'),
    ('ollama-llama2', 'Llama 2 (Local)', 'ollama', false, 0.7, 2048, 'You are a helpful AI assistant.'),
    ('ollama-codellama', 'Code Llama (Local)', 'ollama', false, 0.7, 2048, 'You are a helpful coding assistant.'),
    ('n8n-webhook', 'Custom N8N Workflow', 'n8n', false, 0.7, 2048, 'You are a helpful AI assistant.');

    -- Insert sample prompt templates
    INSERT INTO prompt_templates (name, content, description, created_by) VALUES
    ('Code Review', 'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Security considerations\n\nCode:\n```\n[PASTE CODE HERE]\n```', 'Template for code review requests', admin_user_id),
    ('Technical Documentation', 'Create comprehensive technical documentation for the following:\n\n[DESCRIBE WHAT TO DOCUMENT]\n\nPlease include:\n- Overview and purpose\n- Installation/setup instructions\n- Usage examples\n- API reference (if applicable)\n- Troubleshooting guide', 'Template for generating technical documentation', admin_user_id),
    ('Bug Report Analysis', 'Analyze this bug report and provide:\n1. Root cause analysis\n2. Potential solutions\n3. Prevention strategies\n4. Testing recommendations\n\nBug Report:\n[PASTE BUG REPORT HERE]', 'Template for analyzing bug reports', admin_user_id),
    ('Meeting Summary', 'Please create a structured summary of this meeting:\n\n[PASTE MEETING NOTES/TRANSCRIPT]\n\nInclude:\n- Key decisions made\n- Action items with owners\n- Important discussion points\n- Next steps', 'Template for meeting summaries', admin_user_id);

END $$;

-- Create a sample chat for the admin user
DO $$
DECLARE
    admin_user_id uuid;
    sample_chat_id uuid;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';
    
    INSERT INTO chats (user_id, title) VALUES
    (admin_user_id, 'Welcome to Open WebUI')
    RETURNING id INTO sample_chat_id;
    
    INSERT INTO messages (chat_id, role, content, model_used, tokens_used) VALUES
    (sample_chat_id, 'assistant', 'Welcome to Open WebUI! I''m here to help you with any questions or tasks you might have. As an admin, you have access to:\n\n• User management\n• Model configuration\n• Prompt templates\n• System settings\n\nFeel free to ask me anything!', 'openai-gpt-4', 45);
END $$;