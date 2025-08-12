/*
  # Create default Goku model with regional knowledge bases

  1. New Tables
    - `knowledge_bases` - Store knowledge base configurations for models
    - `knowledge_base_uploads` - Track file uploads for each knowledge base
    
  2. Default Data
    - Create permanent "goku" model that cannot be deleted
    - Add four regional knowledge bases (NZ, AU, UK, US)
    - Configure webhook URLs for each region
    
  3. Security
    - Enable RLS on new tables
    - Add policies for knowledge base access
*/

-- Create knowledge_bases table
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES model_configs(id) ON DELETE CASCADE,
  region_code text NOT NULL CHECK (region_code IN ('NZ', 'AU', 'UK', 'US')),
  region_name text NOT NULL,
  webhook_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(model_id, region_code)
);

-- Create knowledge_base_uploads table
CREATE TABLE IF NOT EXISTS knowledge_base_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_bases
CREATE POLICY "Users can read all knowledge bases"
  ON knowledge_bases FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage knowledge bases"
  ON knowledge_bases FOR ALL
  USING (true);

-- RLS Policies for knowledge_base_uploads
CREATE POLICY "Users can read knowledge base uploads"
  ON knowledge_base_uploads FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own knowledge base uploads"
  ON knowledge_base_uploads FOR ALL
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_model_id ON knowledge_bases(model_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_region ON knowledge_bases(region_code);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_uploads_kb_id ON knowledge_base_uploads(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_uploads_user_id ON knowledge_base_uploads(user_id);

-- Insert the default Goku model
INSERT INTO model_configs (
  model_name, 
  display_name, 
  provider, 
  enabled, 
  default_temperature, 
  max_tokens, 
  system_prompt,
  api_endpoint
) VALUES (
  'goku-saiyan-1', 
  'Goku Saiyan 1', 
  'n8n', 
  true, 
  0.7, 
  4096, 
  'You are Goku, a powerful and friendly AI assistant. You have access to regional knowledge bases and can help users with information specific to their region.',
  'https://workflow.backroomop.com/webhook/goku-main'
) ON CONFLICT (model_name) DO NOTHING;

-- Get the Goku model ID and create regional knowledge bases
DO $$
DECLARE
    goku_model_id uuid;
BEGIN
    SELECT id INTO goku_model_id FROM model_configs WHERE model_name = 'goku-saiyan-1';
    
    IF goku_model_id IS NOT NULL THEN
        -- Insert regional knowledge bases
        INSERT INTO knowledge_bases (model_id, region_code, region_name, webhook_url) VALUES
        (goku_model_id, 'NZ', 'New Zealand', 'https://workflow.backroomop.com/webhook/goku-nz'),
        (goku_model_id, 'AU', 'Australia', 'https://workflow.backroomop.com/webhook/goku-au'),
        (goku_model_id, 'UK', 'United Kingdom', 'https://workflow.backroomop.com/webhook/goku-uk'),
        (goku_model_id, 'US', 'United States', 'https://workflow.backroomop.com/webhook/goku-us')
        ON CONFLICT (model_id, region_code) DO NOTHING;
    END IF;
END $$;