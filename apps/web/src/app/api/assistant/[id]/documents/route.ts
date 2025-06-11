import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取 assistant 的 context documents
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // 首先验证 assistant 属于当前用户
    const { data: assistant } = await supabase
      .from('assistants')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .single()

    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // 获取 context documents
    const { data: documents, error } = await supabase
      .from('context_documents')
      .select('*')
      .eq('assistant_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch context documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch context documents' },
        { status: 500 }
      )
    }

    return NextResponse.json(documents || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/assistant/[id]/documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新 assistant 的 context documents
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { documents } = body

    const supabase = createClient()

    // 首先验证 assistant 属于当前用户
    const { data: assistant } = await supabase
      .from('assistants')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .single()

    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // 删除现有的 context documents
    await supabase
      .from('context_documents')
      .delete()
      .eq('assistant_id', params.id)

    // 如果有新的 documents，插入它们
    if (documents && documents.length > 0) {
      const documentsToInsert = documents.map((doc: any) => ({
        assistant_id: params.id,
        name: doc.name,
        content: doc.content,
        metadata: doc.metadata || {},
      }))

      const { error: insertError } = await supabase
        .from('context_documents')
        .insert(documentsToInsert)

      if (insertError) {
        console.error('Failed to insert context documents:', insertError)
        return NextResponse.json(
          { error: 'Failed to update context documents' },
          { status: 500 }
        )
      }
    }

    // 重新获取更新后的 documents
    const { data: updatedDocuments, error: fetchError } = await supabase
      .from('context_documents')
      .select('*')
      .eq('assistant_id', params.id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Failed to fetch updated context documents:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated context documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents: updatedDocuments || [],
    })
  } catch (error) {
    console.error('Unexpected error in PUT /api/assistant/[id]/documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 