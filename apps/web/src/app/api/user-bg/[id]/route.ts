import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// PUT - 更新背景数据
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { name, description, content } = body

    // 验证必需字段
    if (!name || !description || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, content' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 首先验证记录是否属于该用户
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_bg')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    if (existingRecord.user_id !== authRes.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('user_bg')
      .update({
        name,
        description,
        content,
      })
      .eq('id', id)
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
        { error: 'Failed to update user background data' },
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
    })
  } catch (error) {
    console.error('Unexpected error in PUT /api/user-bg/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除背景数据
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const supabase = createClient()

    // 首先验证记录是否属于该用户
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_bg')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }

    if (existingRecord.user_id !== authRes.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('user_bg')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete user background data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/user-bg/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 