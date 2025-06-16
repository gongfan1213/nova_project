import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'

// GET - 获取用户配置
export async function GET() {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authRes.user.id)
      .single()

    if (error) {
      // 如果用户配置不存在，返回默认值
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          data: {
            id: null,
            user_id: authRes.user.id,
            display_name: authRes.user.user_metadata?.name || authRes.user.user_metadata?.full_name || '',
            bio: '',
            avatar_url: authRes.user.user_metadata?.avatar_url || '',
            settings: {},
            preferences: {},
            created_at: null,
            updated_at: null,
          }
        })
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in GET /api/user-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT - 创建或更新用户配置
export async function POST(request: NextRequest) {
  try {
    const authRes = await verifyUserAuthenticated()
    if (!authRes?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, bio, avatar_url, settings, preferences } = body

    const supabase = createClient()

    // 使用 upsert 来创建或更新
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: authRes.user.id,
        display_name,
        bio,
        avatar_url,
        settings: settings || {},
        preferences: preferences || {},
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in POST /api/user-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 更新用户配置（别名到POST）
export async function PUT(request: NextRequest) {
  return POST(request)
} 