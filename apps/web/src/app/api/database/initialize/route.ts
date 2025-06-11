import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 表的 CREATE 语句
const CREATE_STATEMENTS: { [tableName: string]: string } = {
  projects: `
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
  `,
  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  assistants: `
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
  `,
  threads: `
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
  `,
  messages: `
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
  `,
  artifacts: `
    CREATE TABLE IF NOT EXISTS artifacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id UUID REFERENCES threads(id),
      user_id UUID REFERENCES auth.users(id),
      current_index INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `,
  artifact_contents: `
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
  `,
  context_documents: `
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
  `,
  reflections: `
    CREATE TABLE IF NOT EXISTS reflections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id),
      assistant_id UUID REFERENCES assistants(id),
      content JSONB NOT NULL,
      style_rules JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  quick_actions: `
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
  `
}

export async function POST(request: NextRequest) {
  try {
    const { missingTables } = await request.json()
    
    if (!missingTables || !Array.isArray(missingTables)) {
      return NextResponse.json(
        { error: '无效的请求参数' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const results: { [tableName: string]: { success: boolean; error?: string } } = {}

    // 按依赖顺序创建表
    const createOrder = [
      'tags',
      'assistants', 
      'projects',
      'threads',
      'messages',
      'artifacts',
      'artifact_contents',
      'context_documents',
      'reflections',
      'quick_actions'
    ]

    for (const tableName of createOrder) {
      if (missingTables.includes(tableName)) {
        try {
          const sql = CREATE_STATEMENTS[tableName]
          if (!sql) {
            results[tableName] = { 
              success: false, 
              error: `未找到表 ${tableName} 的创建语句` 
            }
            continue
          }

          // 方法1: 尝试使用 RPC 执行 SQL
          const { error } = await supabase.rpc('execute_sql', { 
            sql_query: sql.trim()
          })

          if (error && error.message?.includes('function execute_sql')) {
            // 如果RPC不存在，尝试其他方法
            console.warn(`RPC execute_sql 不存在，尝试直接创建表 ${tableName}`)
            
            // 方法2: 对于某些简单表，可以尝试直接插入操作来"创建"表
            // 这实际上不会创建表，但可以检测表是否存在
            const testResult = await supabase
              .from(tableName)
              .select('id')
              .limit(1)
            
            if (testResult.error) {
              // 表不存在，记录需要手动创建
              results[tableName] = { 
                success: false, 
                error: `表不存在，需要手动执行 CREATE TABLE 语句。数据库用户可能缺少DDL权限。` 
              }
            } else {
              // 表已存在
              results[tableName] = { 
                success: true
              }
            }
          } else if (error) {
            results[tableName] = { 
              success: false, 
              error: `创建表失败: ${error.message}` 
            }
          } else {
            results[tableName] = { success: true }
          }
        } catch (err) {
          results[tableName] = { 
            success: false, 
            error: `创建表异常: ${err instanceof Error ? err.message : String(err)}` 
          }
        }
      }
    }

    // 检查是否有成功创建的表
    const successCount = Object.values(results).filter(r => r.success).length
    const totalCount = Object.keys(results).length

    return NextResponse.json({
      results,
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount
      }
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return NextResponse.json(
      { error: `数据库初始化失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
} 