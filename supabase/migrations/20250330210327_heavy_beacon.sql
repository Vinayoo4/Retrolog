/*
  # Add categories and enhance admin features

  1. Changes
    - Add categories table
    - Add category_id to diary_entries
    - Add admin_role to users table
    - Add indexes for performance

  2. Security
    - Enable RLS on categories table
    - Add policies for public read access
    - Add policies for admin write access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add policies for categories
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can modify categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Add category_id to diary_entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diary_entries' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE diary_entries ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- Add admin_role to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'admin_role'
  ) THEN
    ALTER TABLE users ADD COLUMN admin_role boolean DEFAULT false;
  END IF;
END $$;

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_diary_entries_category ON diary_entries(category_id);

-- Insert default categories
INSERT INTO categories (name, description)
VALUES 
  ('Personal', 'Personal thoughts and reflections'),
  ('Tech', 'Technology-related entries'),
  ('Travel', 'Travel experiences and adventures'),
  ('Health', 'Health and wellness related entries'),
  ('Work', 'Work-related thoughts and experiences')
ON CONFLICT (name) DO NOTHING;