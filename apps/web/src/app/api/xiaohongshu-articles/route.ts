import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  // 复制时生成新 id 和时间
  const newArticle = {
    ...body,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // 不再自动加 '（副本）'，title 由前端生成
  }
  const { error, data } = await supabase
    .from('project_xiaohongshu_articles')
    .insert([newArticle])
    .select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data[0])
} 