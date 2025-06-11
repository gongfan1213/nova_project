import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取单个 assistant
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
    const { data: assistant, error } = await supabase
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
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assistant not found' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch assistant:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assistant' },
        { status: 500 }
      )
    }

    // 转换为与 LangGraph SDK 兼容的格式
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
          documents: assistant.context_documents,
        },
      },
      created_at: assistant.created_at,
      updated_at: assistant.updated_at,
    }

    return NextResponse.json(formattedAssistant)
  } catch (error) {
    console.error('Unexpected error in GET /api/assistant/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新 assistant
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
    const { name, metadata, config } = body

    const supabase = createClient()

    // 检查 assistant 是否存在且属于当前用户
    const { data: existingAssistant, error: fetchError } = await supabase
      .from('assistants')
      .select('id, is_default')
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Assistant not found' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch existing assistant:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch assistant' },
        { status: 500 }
      )
    }

    // 处理默认设置
    const isDefault = metadata?.is_default
    if (isDefault && !existingAssistant.is_default) {
      // 将其他 assistant 的 is_default 设为 false
      await supabase
        .from('assistants')
        .update({ is_default: false })
        .eq('user_id', authRes.user.id)
        .neq('id', params.id)
    }

    const { data: assistant, error } = await supabase
      .from('assistants')
      .update({
        name,
        description: metadata?.description,
        icon_name: metadata?.iconData?.iconName,
        icon_color: metadata?.iconData?.iconColor,
        system_prompt: config?.configurable?.systemPrompt,
        tools: config?.configurable?.tools,
        is_default: isDefault,
      })
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update assistant:', error)
      return NextResponse.json(
        { error: 'Failed to update assistant' },
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

    return NextResponse.json(formattedAssistant)
  } catch (error) {
    console.error('Unexpected error in PUT /api/assistant/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 删除 assistant
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // 检查是否是默认 assistant，如果是则需要设置新的默认 assistant
    const { data: currentAssistant } = await supabase
      .from('assistants')
      .select('is_default')
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)
      .single()

    if (!currentAssistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      )
    }

    // 删除 assistant
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', params.id)
      .eq('user_id', authRes.user.id)

    if (error) {
      console.error('Failed to delete assistant:', error)
      return NextResponse.json(
        { error: 'Failed to delete assistant' },
        { status: 500 }
      )
    }

    // 如果删除的是默认 assistant，设置新的默认 assistant
    if (currentAssistant.is_default) {
      const { data: remainingAssistants } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', authRes.user.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (remainingAssistants && remainingAssistants.length > 0) {
        await supabase
          .from('assistants')
          .update({ is_default: true })
          .eq('id', remainingAssistants[0].id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/assistant/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 