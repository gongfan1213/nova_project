import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取用户的背景数据
export async function GET(request: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 可选，筛选特定类型

    const supabase = createClient()
    let query = supabase
      .from('user_bg')
      .select('*')
      .eq('user_id', authRes.user.id)
      .order('created_at', { ascending: false })

    // 如果指定了类型，则筛选
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user background data' },
        { status: 500 }
      )
    }

    // 按类型分组数据
    const groupedData: {
      personalities: any[]
      intentions: any[]
      resources: any[]
      accountStyles: any[]
    } = {
      personalities: [],
      intentions: [],
      resources: [],
      accountStyles: [],
    }

    data.forEach((item: any) => {
      if (groupedData[item.type as keyof typeof groupedData]) {
        groupedData[item.type as keyof typeof groupedData].push({
          id: item.id,
          name: item.name,
          description: item.description,
          content: item.content,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        })
      }
    })

    return NextResponse.json({ data: groupedData })
  } catch (error) {
    console.error('Unexpected error in GET /api/user-bg:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 新增背景数据
export async function POST(request: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, name, description, content } = body

    // 验证必需字段
    if (!type || !name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, description, content' },
        { status: 400 }
      )
    }

    // 验证类型
    const validTypes = ['personalities', 'intentions', 'resources', 'accountStyles']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_bg')
      .insert({
        user_id: authRes.user.id,
        type,
        name,
        description,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // 处理唯一约束违反
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A record with this name already exists for this type' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create user background data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        id: data.id,
        name: data.name,
        description: data.description,
        content: data.content,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/user-bg:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 