/*
  # Add is_public column to diary_entries table

  1. Changes
    - Add `is_public` boolean column to `diary_entries` table with default value false
    - Add policy to allow public access to entries marked as public

  2. Security
    - Add policy for public access to entries marked as public
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE diary_entries ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

-- Policy for public access to public entries
CREATE POLICY "Anyone can read public entries"
  ON diary_entries
  FOR SELECT
  TO public
  USING (is_public = true);