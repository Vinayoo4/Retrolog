/*
  # Create diary entries table

  1. New Tables
    - `diary_entries`
      - `id` (uuid, primary key)
      - `content` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `diary_entries` table
    - Add policies for authenticated users to:
      - Read their own entries
      - Create new entries
*/

CREATE TABLE IF NOT EXISTS diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own entries"
  ON diary_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries"
  ON diary_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);