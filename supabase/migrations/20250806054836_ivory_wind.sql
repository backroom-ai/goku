/*
  # Add attachments column to messages table

  1. Changes
    - Add `attachments` column to `messages` table to store file attachment metadata
    - Column stores JSON data with attachment information (filename, size, type, etc.)
    
  2. Security
    - No changes to RLS policies needed as attachments are part of messages
*/

-- Add attachments column to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE messages ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add index for attachments queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages USING gin(attachments);