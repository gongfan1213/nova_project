-- ================================================
-- Nova Project - Supabase Database Setup Script
-- ================================================
-- 
-- This script sets up the necessary permissions and helper functions
-- for the Nova project database initialization feature to work properly.
-- 
-- Run this script in your Supabase SQL Editor with admin privileges.

-- ================================================
-- 1. Grant basic permissions for reading schema information
-- ================================================

-- Allow reading table and column information from information_schema
GRANT SELECT ON information_schema.tables TO anon, authenticated;
GRANT SELECT ON information_schema.columns TO anon, authenticated;

-- ================================================
-- 2. Grant DDL permissions for creating and modifying tables
-- ================================================

-- Allow creating new tables in the public schema
GRANT CREATE ON SCHEMA public TO anon, authenticated;

-- Allow altering existing tables (for adding missing columns)
GRANT ALTER ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also get the right permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- ================================================
-- 3. Create helper RPC functions (recommended for better performance)
-- ================================================

-- Function to execute SQL commands safely
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute the provided SQL query
  EXECUTE sql_query;
  
  -- Return success response
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
  
EXCEPTION WHEN OTHERS THEN
  -- Return error response with details
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Function to get comprehensive table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  ordinal_position integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name, c.ordinal_position;
$$;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION table_exists(table_name_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name_param
  );
$$;

-- Function to get column information for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  ordinal_position integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
$$;

-- ================================================
-- 4. Grant execution permissions on the RPC functions
-- ================================================

GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_info() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION table_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO anon, authenticated;

-- ================================================
-- 5. Create the Nova project tables (optional - can be done via the UI)
-- ================================================

-- Tags table (no dependencies)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assistants table (no dependencies)
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  icon_name TEXT DEFAULT 'User',
  icon_color TEXT DEFAULT '#000000',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb
);

-- Projects table (no dependencies)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  status TEXT,
  tags TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Threads table (depends on assistants)
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  title TEXT,
  model_name TEXT,
  model_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  conversation_id TEXT
);

-- Messages table (depends on threads)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('human', 'ai', 'system')),
  content TEXT NOT NULL,
  run_id TEXT,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  additional_kwargs JSONB DEFAULT '{}'::jsonb,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  tool_calls JSONB DEFAULT '[]'::jsonb,
  usage_metadata JSONB
);

-- Artifacts table (depends on threads)
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id),
  user_id UUID REFERENCES auth.users(id),
  current_index INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Artifact contents table (depends on artifacts)
CREATE TABLE IF NOT EXISTS artifact_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id),
  index INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'code')),
  title TEXT NOT NULL,
  language TEXT,
  code TEXT,
  full_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Context documents table (depends on assistants)
CREATE TABLE IF NOT EXISTS context_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Reflections table (depends on assistants)
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_id UUID REFERENCES assistants(id),
  content JSONB NOT NULL,
  style_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quick actions table (no dependencies)
CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 6. Enable Row Level Security (RLS)
-- ================================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 7. Create RLS policies for user data access
-- ================================================

-- Tags policies
CREATE POLICY "Users can view their own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (You can add more specific policies based on your security requirements)

-- ================================================
-- 8. Create useful indexes for performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_assistants_user_id ON assistants(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_assistant_id ON threads(assistant_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_thread_id ON artifacts(thread_id);
CREATE INDEX IF NOT EXISTS idx_artifact_contents_artifact_id ON artifact_contents(artifact_id);

-- ================================================
-- Setup Complete!
-- ================================================

-- You can now use the Nova database initialization page at /database-init
-- The page will be able to:
-- 1. Check existing table structures
-- 2. Create missing tables
-- 3. Add missing columns to existing tables
-- 4. Provide detailed status information

SELECT 'Nova Database Setup Complete!' as status; 