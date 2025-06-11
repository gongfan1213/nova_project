import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { tableName, missingColumns, incorrectColumns } = await request.json()
    
    if (!tableName) {
      return NextResponse.json(
        { error: '缺少表名参数' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const results: { [operation: string]: { success: boolean; error?: string } } = {}

    // 添加缺失的字段
    if (missingColumns && Array.isArray(missingColumns)) {
      for (const column of missingColumns) {
        try {
          const alterSql = generateAddColumnSQL(tableName, column)
          
          const { error } = await supabase.rpc('execute_sql', { 
            sql_query: alterSql
          })

          if (error) {
            results[`add_${column.name}`] = { 
              success: false, 
              error: `添加字段失败: ${error.message}` 
            }
          } else {
            results[`add_${column.name}`] = { success: true }
          }
        } catch (err) {
          results[`add_${column.name}`] = { 
            success: false, 
            error: `添加字段异常: ${err instanceof Error ? err.message : String(err)}` 
          }
        }
      }
    }

    // 修改不正确的字段（这个比较复杂，通常需要手动处理）
    if (incorrectColumns && Array.isArray(incorrectColumns)) {
      for (const column of incorrectColumns) {
        results[`modify_${column.name}`] = { 
          success: false, 
          error: '字段类型修改需要手动处理，建议备份数据后重新创建表' 
        }
      }
    }

    const successCount = Object.values(results).filter(r => r.success).length
    const totalCount = Object.keys(results).length

    return NextResponse.json({
      success: successCount === totalCount,
      message: `成功执行 ${successCount}/${totalCount} 个操作`,
      results
    })

  } catch (error) {
    console.error('数据库更新失败:', error)
    return NextResponse.json(
      { 
        error: '数据库更新失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

function generateAddColumnSQL(tableName: string, column: any): string {
  let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.data_type}`
  
  if (column.is_nullable === 'NO') {
    sql += ' NOT NULL'
  }
  
  if (column.column_default) {
    sql += ` DEFAULT ${column.column_default}`
  }
  
  return sql + ';'
} 