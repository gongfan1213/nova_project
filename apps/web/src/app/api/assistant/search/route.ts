import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// POST - 搜索 assistants (模拟 LangGraph SDK 的 search 方法)
export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { metadata, graphId, limit = 100 } = body

    const supabase = createClient()
    
    // 构建查询
    let query = supabase
      .from('assistants')
      .select(`
        id,
        name,
        description,
        icon_name,
        icon_color,
        system_prompt,
        is_default,
        created_at,
        updated_at,
        tools,
        context_documents (
          id,
          name,
          content,
          metadata,
          created_at
        )
      `)
      .eq('user_id', authRes.user.id)
      .order('created_at', { ascending: true })
      .limit(limit)

    // 如果有 metadata 过滤条件
    if (metadata) {
      // 检查 user_id 过滤
      if (metadata.user_id && metadata.user_id !== authRes.user.id) {
        // 用户只能搜索自己的 assistants
        return NextResponse.json([])
      }

      // 检查 is_default 过滤
      if (metadata.is_default !== undefined) {
        query = query.eq('is_default', metadata.is_default)
      }
    }

    // 如果指定了 graphId，这里暂时忽略，因为我们的实现不需要 graphId
    // 在实际使用中，LangGraph 的 graphId 用于区分不同类型的 assistant

    const { data: assistants, error } = await query

    if (error) {
      console.error('Failed to search assistants:', error)
      return NextResponse.json(
        { error: 'Failed to search assistants' },
        { status: 500 }
      )
    }

    // 转换为与 LangGraph SDK 兼容的格式
    const formattedAssistants = assistants.map((assistant) => ({
      assistant_id: assistant.id,
      name: assistant.name,
      graphId: graphId || 'agent', // 默认 graphId
      metadata: {
        user_id: authRes.user.id,
        description: assistant.description,
        is_default: assistant.is_default,
        iconData: {
          iconName: assistant.icon_name,
          iconColor: assistant.icon_color,
        },
      },
      config: {
        configurable: {
          systemPrompt: assistant.system_prompt,
          tools: assistant.tools,
          documents: assistant.context_documents,
        },
      },
      created_at: assistant.created_at,
      updated_at: assistant.updated_at,
    }))

    return NextResponse.json(formattedAssistants)
  } catch (error) {
    console.error('Unexpected error in POST /api/assistant/search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 