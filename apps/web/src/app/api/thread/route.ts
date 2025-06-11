import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 搜索用户的 Threads
export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const metadata = searchParams.get('metadata')

    const supabase = createClient()

    // 构建查询
    let query = supabase
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
      .eq('user_id', authRes.user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)

    // 如果有元数据过滤条件
    if (metadata) {
      try {
        const metadataFilter = JSON.parse(metadata)
        // 这里可以添加更复杂的元数据过滤逻辑
        if (metadataFilter.supabase_user_id) {
          // LangGraph 兼容性：通过 metadata 中的 user_id 过滤
          query = query.eq('user_id', metadataFilter.supabase_user_id)
        }
      } catch (e) {
        console.warn('Invalid metadata filter:', metadata)
      }
    }

    const { data: threads, error } = await query

    if (error) {
      console.error('Failed to fetch threads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }

    // 转换为 LangGraph 兼容格式
    const langGraphThreads = await Promise.all(
      (threads || []).map(async (thread) => {
        // 获取关联的 messages 和 artifacts
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', thread.id)
          .order('sequence_number', { ascending: true })

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

        return {
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
          values: Object.keys(values).length > 0 ? values : undefined,
        }
      })
    )

    return NextResponse.json(langGraphThreads)
  } catch (error) {
    console.error('Unexpected error in GET /api/thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建新 Thread
export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { metadata = {} } = body

    const supabase = createClient()

    // 如果指定了 assistant，验证是否属于当前用户
    let assistantId = null
    if (metadata.assistant_id) {
      const { data: assistant } = await supabase
        .from('assistants')
        .select('id')
        .eq('id', metadata.assistant_id)
        .eq('user_id', authRes.user.id)
        .single()

      if (assistant) {
        assistantId = assistant.id
      }
    } else {
      // 如果没有指定 assistant，使用默认的
      const { data: defaultAssistant } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', authRes.user.id)
        .eq('is_default', true)
        .single()

      if (defaultAssistant) {
        assistantId = defaultAssistant.id
      } else {
        // 如果没有默认 assistant，取第一个
        const { data: firstAssistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('user_id', authRes.user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (firstAssistant) {
          assistantId = firstAssistant.id
        }
      }
    }

    // 创建 Thread
    const { data: newThread, error } = await supabase
      .from('threads')
      .insert({
        user_id: authRes.user.id,
        assistant_id: assistantId,
        title: metadata.thread_title || null,
        model_name: metadata.customModelName || null,
        model_config: metadata.modelConfig || {},
        metadata: {
          ...metadata,
          supabase_user_id: authRes.user.id,
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create thread:', error)
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      )
    }

    // 返回 LangGraph 兼容格式
    const langGraphThread = {
      thread_id: newThread.id,
      created_at: newThread.created_at,
      updated_at: newThread.updated_at,
      metadata: {
        supabase_user_id: newThread.user_id,
        customModelName: newThread.model_name,
        modelConfig: newThread.model_config,
        thread_title: newThread.title,
        conversation_id: newThread.conversation_id,
        ...newThread.metadata,
      },
      values: {}, // 新创建的 thread 没有 messages 和 artifacts
    }

    return NextResponse.json(langGraphThread)
  } catch (error) {
    console.error('Unexpected error in POST /api/thread:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 