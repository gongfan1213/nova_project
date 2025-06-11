import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取用户的所有 assistants
export async function GET() {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { data: assistants, error } = await supabase
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

    if (error) {
      console.error('Failed to fetch assistants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assistants' },
        { status: 500 }
      )
    }

    // 转换为与 LangGraph SDK 兼容的格式
    const formattedAssistants = assistants.map((assistant) => ({
      assistant_id: assistant.id,
      name: assistant.name,
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
    console.error('Unexpected error in GET /api/assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 创建新的 assistant
export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, metadata, config } = body

    const supabase = createClient()

    // 如果这是第一个 assistant 或明确设置为默认，则设为默认
    let isDefault = metadata?.is_default || false
    if (isDefault) {
      // 先将其他 assistant 的 is_default 设为 false
      await supabase
        .from('assistants')
        .update({ is_default: false })
        .eq('user_id', authRes.user.id)
    } else {
      // 检查是否有任何默认 assistant
      const { data: existingAssistants } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', authRes.user.id)
        .limit(1)

      // 如果这是第一个 assistant，设为默认
      if (!existingAssistants || existingAssistants.length === 0) {
        isDefault = true
      }
    }

    const { data: assistant, error } = await supabase
      .from('assistants')
      .insert({
        name,
        description: metadata?.description,
        icon_name: metadata?.iconData?.iconName || 'User',
        icon_color: metadata?.iconData?.iconColor || '#000000',
        system_prompt: config?.configurable?.systemPrompt,
        tools: config?.configurable?.tools,
        is_default: isDefault,
        user_id: authRes.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create assistant:', error)
      return NextResponse.json(
        { error: 'Failed to create assistant' },
        { status: 500 }
      )
    }

    // 返回与 LangGraph SDK 兼容的格式
    const formattedAssistant = {
      assistant_id: assistant.id,
      name: assistant.name,
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
        },
      },
      created_at: assistant.created_at,
      updated_at: assistant.updated_at,
    }

    return NextResponse.json(formattedAssistant, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/assistant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 