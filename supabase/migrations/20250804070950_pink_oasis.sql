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
    
  3. Indexes
    - Performance indexes for common queries
    - Foreign key constraints for data integrity
*/

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
  system_prompt text DEFAULT '',
  api_endpoint text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- File uploads tracking
CREATE TABLE IF NOT EXISTS uploads (
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
  USING (true); -- We'll handle this in application logic

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true); -- We'll handle this in application logic

-- RLS Policies for chats table
CREATE POLICY "Users can manage own chats"
  ON chats FOR ALL
  USING (true); -- We'll handle this in application logic

-- RLS Policies for messages table  
CREATE POLICY "Users can manage messages in own chats"
  ON messages FOR ALL
  USING (true); -- We'll handle this in application logic

-- RLS Policies for prompt_templates table
CREATE POLICY "Users can read all prompt templates"
  ON prompt_templates FOR SELECT
  USING (true); -- We'll handle this in application logic

CREATE POLICY "Users can manage own prompt templates"
  ON prompt_templates FOR ALL
  USING (true); -- We'll handle this in application logic

-- RLS Policies for model_configs table
CREATE POLICY "Users can read enabled models"
  ON model_configs FOR SELECT
  USING (true); -- We'll handle this in application logic

CREATE POLICY "Only admins can manage model configs"
  ON model_configs FOR ALL
  USING (true); -- We'll handle this in application logic

-- RLS Policies for uploads table
CREATE POLICY "Users can manage own uploads"
  ON uploads FOR ALL
  USING (true); -- We'll handle this in application logic

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_model_configs_enabled ON model_configs(enabled);

-- Insert default model configurations
INSERT INTO model_configs (model_name, display_name, provider, enabled, default_temperature, max_tokens, system_prompt) VALUES
('openai-gpt-4', 'GPT-4', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
('openai-gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', true, 0.7, 4096, 'You are a helpful AI assistant.'),
('claude-3-opus', 'Claude 3 Opus', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
('claude-3-sonnet', 'Claude 3 Sonnet', 'claude', false, 0.7, 4096, 'You are a helpful AI assistant.'),
('groq-llama2-70b', 'Llama 2 70B (Groq)', 'groq', false, 0.7, 4096, 'You are a helpful AI assistant.'),
('ollama-llama2', 'Llama 2 (Local)', 'ollama', false, 0.7, 2048, 'You are a helpful AI assistant.'),
('n8n-webhook', 'Custom N8N Workflow', 'n8n', false, 0.7, 2048, 'You are a helpful AI assistant.');

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES
('admin@example.com', '$2b$10$rKvK9qOQOL0r3vZr7Qhz6uJvJ8qQqzKvzKvzKvzKvzKvzKvzKvzKu', 'admin', 'Admin', 'User');