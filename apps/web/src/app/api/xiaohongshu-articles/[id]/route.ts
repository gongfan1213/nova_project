import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { error } = await supabase
    .from('project_xiaohongshu_articles')
    .delete()
    .eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await req.json()
  const { error, data } = await supabase
    .from('project_xiaohongshu_articles')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data[0])
} 