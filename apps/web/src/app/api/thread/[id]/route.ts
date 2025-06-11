import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取单个 Thread
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const supabase = createClient()

    // 获取 Thread 基本信息
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(`
        id,
        user_id,
        assistant_id,
        conversation_id,
        title,
        model_name,
        model_config,
        created_at,
        updated_at,
        metadata,
        assistants (
          id,
          name,
          icon_name,
          icon_color
        )
      `)
      .eq('id', id)
      .eq('user_id', authRes.user.id) // 确保只能访问自己的 Thread
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // 获取关联的 messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('sequence_number', { ascending: true })

    // 获取关联的 artifacts
    const { data: artifacts } = await supabase
      .from('artifacts')
      .select(`
        *,
        artifact_contents (*)
      `)
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: false })

    // 构建 LangGraph 兼容的 values 结构
    const values: any = {}
    
    if (messages && messages.length > 0) {
      values.messages = messages
    }

    if (artifacts && artifacts.length > 0) {
      // 取最新的 artifact
      const latestArtifact = artifacts[0]
      if (latestArtifact.artifact_contents && latestArtifact.artifact_contents.length > 0) {
        values.artifact = {
          currentIndex: latestArtifact.current_index || 1,
          contents: latestArtifact.artifact_contents.map((content: any) => ({
            index: content.index,
            type: content.type,
            title: content.title,
            language: content.language,
            code: content.code,
            fullMarkdown: content.full_markdown,
          }))
        }
      }
    }

    // 返回 LangGraph 兼容格式
    const langGraphThread = {
      thread_id: thread.id,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      metadata: {
        supabase_user_id: thread.user_id,
        customModelName: thread.model_name,
        modelConfig: thread.model_config,
        thread_title: thread.title,
        conversation_id: thread.conversation_id,
        ...thread.metadata,
      },
      values: Object.keys(values).length > 0 ? values : {},
    }

    return NextResponse.json(langGraphThread)
  } catch (error) {
    console.error('Unexpected error in GET /api/thread/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新 Thread
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { metadata = {} } = body

    const supabase = createClient()

    // 验证 Thread 存在且属于当前用户
    const { data: existingThread, error: checkError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', id)
      .eq('user_id', authRes.user.id)
      .single()

    if (checkError || !existingThread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // 更新 Thread
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (metadata.thread_title !== undefined) {
      updateData.title = metadata.thread_title
    }

    if (metadata.customModelName !== undefined) {
      updateData.model_name = metadata.customModelName
    }

    if (metadata.modelConfig !== undefined) {
      updateData.model_config = metadata.modelConfig
    }

    if (metadata.conversation_id !== undefined) {
      updateData.conversation_id = metadata.conversation_id
    }

    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata
    }

    const { data: updatedThread, error: updateError } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', authRes.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update thread:', updateError)
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      )
    }

    // 返回 LangGraph 兼容格式
    const langGraphThread = {
      thread_id: updatedThread.id,
      created_at: updatedThread.created_at,
      updated_at: updatedThread.updated_at,
      metadata: {
        supabase_user_id: updatedThread.user_id,
        customModelName: updatedThread.model_name,
        modelConfig: updatedThread.model_config,
        thread_title: updatedThread.title,
        conversation_id: updatedThread.conversation_id,
        ...updatedThread.metadata,
      },
      values: {}, // 更新操作不返回 values
    }

    return NextResponse.json(langGraphThread)
  } catch (error) {
    console.error('Unexpected error in PUT /api/thread/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除 Thread
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const supabase = createClient()

    // 验证 Thread 存在且属于当前用户
    const { data: existingThread, error: checkError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', id)
      .eq('user_id', authRes.user.id)
      .single()

    if (checkError || !existingThread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // 删除关联数据（由于外键约束，这些会级联删除）
    // 但我们可以显式删除以确保完整性

    // 删除 artifact_contents
    // 首先获取 artifact ids，然后删除 contents
    const { data: artifactIds } = await supabase
      .from('artifacts')
      .select('id')
      .eq('thread_id', id)

    if (artifactIds && artifactIds.length > 0) {
      await supabase
        .from('artifact_contents')
        .delete()
        .in('artifact_id', artifactIds.map(a => a.id))
    }

    // 删除 artifacts
    await supabase
      .from('artifacts')
      .delete()
      .eq('thread_id', id)

    // 删除 messages
    await supabase
      .from('messages')
      .delete()
      .eq('thread_id', id)

    // 删除 Thread
    const { error: deleteError } = await supabase
      .from('threads')
      .delete()
      .eq('id', id)
      .eq('user_id', authRes.user.id)

    if (deleteError) {
      console.error('Failed to delete thread:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/thread/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 