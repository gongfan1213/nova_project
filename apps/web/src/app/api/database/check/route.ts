import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 首先尝试使用原生 SQL 查询 information_schema
    const result = await getTableInfoDirectly(supabase)
    
    if (result) {
      return result
    }
    
    // 如果直接查询失败，返回错误而不是模拟数据
    return NextResponse.json(
      { error: '无法连接到数据库或查询表结构信息' },
      { status: 500 }
    )
  } catch (error) {
    console.error('数据库检查失败:', error)
    return NextResponse.json(
      { error: `数据库查询失败: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

// 直接查询数据库表结构的方式
async function getTableInfoDirectly(supabase: any) {
  try {
    // 方法1: 使用原生SQL查询
    const { data: queryResult, error: sqlError } = await supabase
      .rpc('execute_sql', {
        sql_query: `
          SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.ordinal_position
          FROM information_schema.tables t
          LEFT JOIN information_schema.columns c 
            ON t.table_name = c.table_name 
            AND t.table_schema = c.table_schema
          WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name, c.ordinal_position;
        `
      })

    if (!sqlError && queryResult) {
      return formatQueryResult(queryResult)
    }

    console.warn('RPC查询失败，尝试直接查询information_schema:', sqlError)

    // 方法2: 使用Supabase客户端查询（需要适当权限）
    const tablesResult = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    if (tablesResult.error) {
      console.warn('查询tables失败:', tablesResult.error)
      
      // 方法3: 尝试查询现有表（通过尝试查询每个预期表）
      return await checkTablesByQuery(supabase)
    }

    const result: any = {}

    // 为每个表获取字段信息
    for (const table of tablesResult.data || []) {
      const columnsResult = await supabase
        .from('information_schema.columns')
        .select(`
          column_name,
          data_type,
          is_nullable,
          column_default,
          ordinal_position
        `)
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position')

      if (columnsResult.error) {
        console.error(`获取表 ${table.table_name} 字段信息失败:`, columnsResult.error)
        continue
      }

      result[table.table_name] = {
        columns: columnsResult.data?.map((col: any) => ({
          name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default
        })) || []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('直接查询数据库失败:', error)
    return null
  }
}

// 格式化查询结果
function formatQueryResult(queryResult: any[]) {
  const result: any = {}
  
  for (const row of queryResult) {
    const tableName = row.table_name
    if (!result[tableName]) {
      result[tableName] = { columns: [] }
    }
    
    if (row.column_name) {
      result[tableName].columns.push({
        name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default
      })
    }
  }
  
  return NextResponse.json(result)
}

// 通过尝试查询预期表来检查表是否存在
async function checkTablesByQuery(supabase: any) {
  const expectedTables = [
    'projects', 'tags', 'assistants', 'threads', 'messages', 
    'artifacts', 'artifact_contents', 'context_documents', 
    'reflections', 'quick_actions'
  ]
  
  const result: any = {}
  
  for (const tableName of expectedTables) {
    try {
      // 尝试查询表的第一行来检查表是否存在
      const { data: _data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error) {
        // 表存在，尝试获取列信息（这里只能获取有数据的列）
        result[tableName] = {
          columns: [] // 无法获取完整的列信息，但表确实存在
        }
      }
    } catch (err) {
      // 表不存在或查询失败
      console.log(`表 ${tableName} 不存在或无法访问`)
    }
  }
  
  return NextResponse.json(result)
} 