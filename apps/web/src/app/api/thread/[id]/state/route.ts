import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// PUT - 更新 Thread 状态（Artifact 和 Messages）
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
    const { values } = body

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

    // 开始事务性更新
    try {
      // 更新 Artifact 如果存在
      if (values.artifact) {
        const artifact = values.artifact

        // 查找或创建 Artifact 记录
        const { data: existingArtifact } = await supabase
          .from('artifacts')
          .select('id, current_index')
          .eq('thread_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let artifactId: string

        if (existingArtifact) {
          // 更新现有 Artifact
          const { data: updatedArtifact, error: updateError } = await supabase
            .from('artifacts')
            .update({
              current_index: artifact.currentIndex || existingArtifact.current_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingArtifact.id)
            .select('id')
            .single()

          if (updateError) {
            throw new Error(`Failed to update artifact: ${updateError.message}`)
          }

          artifactId = updatedArtifact.id
        } else {
          // 创建新 Artifact
          const { data: newArtifact, error: createError } = await supabase
            .from('artifacts')
            .insert({
              thread_id: id,
              user_id: authRes.user.id,
              current_index: artifact.currentIndex || 1,
            })
            .select('id')
            .single()

          if (createError) {
            throw new Error(`Failed to create artifact: ${createError.message}`)
          }

          artifactId = newArtifact.id
        }

        // 处理 Artifact Contents
        if (artifact.contents && Array.isArray(artifact.contents)) {
          // 删除现有的 contents（如果是完全替换）
          await supabase
            .from('artifact_contents')
            .delete()
            .eq('artifact_id', artifactId)

          // 插入新的 contents
          const contentsToInsert = artifact.contents.map((content: any) => ({
            artifact_id: artifactId,
            index: content.index,
            type: content.type,
            title: content.title,
            language: content.language || null,
            code: content.code || null,
            full_markdown: content.fullMarkdown || null,
          }))

          if (contentsToInsert.length > 0) {
            const { error: contentsError } = await supabase
              .from('artifact_contents')
              .insert(contentsToInsert)

            if (contentsError) {
              throw new Error(`Failed to insert artifact contents: ${contentsError.message}`)
            }
          }
        }
      }

      // 更新 Messages 如果存在
      if (values.messages && Array.isArray(values.messages)) {
        // 删除现有 messages（如果是完全替换）
        await supabase
          .from('messages')
          .delete()
          .eq('thread_id', id)

        // 插入新的 messages
        const messagesToInsert = values.messages.map((message: any, index: number) => ({
          thread_id: id,
          user_id: authRes.user.id,
          sequence_number: index + 1,
          type: message.type || 'human',
          content: typeof message.content === 'string' 
            ? message.content 
            : JSON.stringify(message.content),
          additional_kwargs: message.additional_kwargs || {},
          response_metadata: message.response_metadata || {},
          tool_calls: message.tool_calls || [],
          usage_metadata: message.usage_metadata || null,
          created_at: message.created_at || new Date().toISOString(),
        }))

        if (messagesToInsert.length > 0) {
          const { error: messagesError } = await supabase
            .from('messages')
            .insert(messagesToInsert)

          if (messagesError) {
            throw new Error(`Failed to insert messages: ${messagesError.message}`)
          }
        }
      }

      // 更新 Thread 的 updated_at 时间戳
      await supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)

      return NextResponse.json({ success: true })
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError)
      return NextResponse.json(
        { error: 'Failed to update thread state' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unexpected error in PUT /api/thread/[id]/state:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 