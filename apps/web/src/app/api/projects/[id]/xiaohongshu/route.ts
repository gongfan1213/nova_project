import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const projectId = params.id;

  // 获取项目关联的所有小红书文章
  const { data, error } = await supabase
    .from("project_xiaohongshu_articles")
    .select("id, title, description, status, category, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
} 