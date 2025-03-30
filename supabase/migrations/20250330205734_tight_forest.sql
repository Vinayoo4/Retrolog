/*
  # Fix diary entries user relationship

  1. Changes
    - Add foreign key relationship between diary_entries.user_id and auth.users.id
    - Add views and likes columns to diary_entries table
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add views and likes columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' AND column_name = 'views'
  ) THEN
    ALTER TABLE diary_entries ADD COLUMN views integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' AND column_name = 'likes'
  ) THEN
    ALTER TABLE diary_entries ADD COLUMN likes integer DEFAULT 0;
  END IF;
END $$;

-- Drop existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'diary_entries_user_id_fkey'
  ) THEN
    ALTER TABLE diary_entries DROP CONSTRAINT diary_entries_user_id_fkey;
  END IF;
END $$;

-- Add foreign key constraint
ALTER TABLE diary_entries
  ADD CONSTRAINT diary_entries_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_created_at ON diary_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_diary_entries_is_public ON diary_entries(is_public);