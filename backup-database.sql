-- Nova Project 数据库完整备份
-- 生成时间: 2025-01-28
-- 项目ID: vhafywrhiabuyknoyzow
-- 数据库版本: PostgreSQL 17.4.1.042

-- 开始事务
BEGIN;

-- ================================================
-- 1. PROJECTS 表备份
-- ================================================

-- 导出 projects 表数据
SELECT 'Backing up projects table...' as status;

COPY (
  SELECT 
    id,
    name,
    description,
    content,
    status,
    tags,
    category,
    created_at,
    updated_at,
    metadata,
    user_id
  FROM public.projects
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 2. TAGS 表备份
-- ================================================

SELECT 'Backing up tags table...' as status;

COPY (
  SELECT 
    id,
    name,
    user_id,
    created_at,
    updated_at
  FROM public.tags
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 3. ASSISTANTS 表备份
-- ================================================

SELECT 'Backing up assistants table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    name,
    description,
    system_prompt,
    icon_name,
    icon_color,
    is_default,
    created_at,
    updated_at,
    metadata,
    config,
    tools
  FROM public.assistants
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 4. THREADS 表备份
-- ================================================

SELECT 'Backing up threads table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    assistant_id,
    title,
    model_name,
    model_config,
    created_at,
    updated_at,
    metadata,
    conversation_id,
    status,
    tags
  FROM public.threads
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 5. MESSAGES 表备份
-- ================================================

SELECT 'Backing up messages table...' as status;

COPY (
  SELECT 
    id,
    thread_id,
    user_id,
    type,
    content,
    run_id,
    sequence_number,
    created_at,
    metadata,
    additional_kwargs,
    response_metadata,
    tool_calls,
    usage_metadata
  FROM public.messages
  ORDER BY created_at, sequence_number
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 6. ARTIFACTS 表备份
-- ================================================

SELECT 'Backing up artifacts table...' as status;

COPY (
  SELECT 
    id,
    thread_id,
    user_id,
    current_index,
    created_at,
    updated_at,
    metadata
  FROM public.artifacts
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 7. ARTIFACT_CONTENTS 表备份
-- ================================================

SELECT 'Backing up artifact_contents table...' as status;

COPY (
  SELECT 
    id,
    artifact_id,
    index,
    type,
    title,
    language,
    code,
    full_markdown,
    created_at
  FROM public.artifact_contents
  ORDER BY artifact_id, index
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 8. CONTEXT_DOCUMENTS 表备份
-- ================================================

SELECT 'Backing up context_documents table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    assistant_id,
    name,
    content,
    file_type,
    file_size,
    created_at,
    metadata
  FROM public.context_documents
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 9. REFLECTIONS 表备份
-- ================================================

SELECT 'Backing up reflections table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    assistant_id,
    content,
    style_rules,
    created_at,
    updated_at
  FROM public.reflections
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 10. QUICK_ACTIONS 表备份
-- ================================================

SELECT 'Backing up quick_actions table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    name,
    description,
    action_type,
    config,
    created_at,
    updated_at
  FROM public.quick_actions
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 11. USER_BG 表备份
-- ================================================

SELECT 'Backing up user_bg table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    type,
    name,
    description,
    content,
    created_at,
    updated_at
  FROM public.user_bg
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- ================================================
-- 12. USER_PROFILES 表备份
-- ================================================

SELECT 'Backing up user_profiles table...' as status;

COPY (
  SELECT 
    id,
    user_id,
    display_name,
    bio,
    avatar_url,
    settings,
    preferences,
    created_at,
    updated_at
  FROM public.user_profiles
  ORDER BY created_at
) TO STDOUT WITH (FORMAT CSV, HEADER);

-- 提交事务
COMMIT;

SELECT 'Database backup completed successfully!' as status; 