import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // 获取所有项目
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
  const { data, error } = await supabase.from("projects").select("*").eq("user_id", user_id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // 新建项目
  const supabase = createClient();
  const { content, tags = [], user_id } = await req.json();
  // 查询已有项目数量，生成编号
  const { data: projects } = await supabase.from("projects").select("id").eq("user_id", user_id);
  const projectNumber = (projects?.length || 0) + 1;
  const title = `项目${projectNumber.toString().padStart(2, "0")}`;
  const description = content.slice(0, 20);
  const { data, error } = await supabase.from("projects").insert([{ title, description, content, tags, user_id }]).select();
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data[0]);
}

export async function PUT(req: NextRequest) {
  // 编辑项目
  const supabase = createClient();
  const { id, title, content, tags, status } = await req.json();
  const { data, error } = await supabase.from("projects").update({ title, content, tags, status, updated_at: new Date() }).eq("id", id).select();
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data[0]);
}

export async function DELETE(req: NextRequest) {
  // 删除所有项目
  const supabase = createClient();
  const { user_id } = await req.json();
  const { error } = await supabase.from("projects").delete().eq("user_id", user_id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ message: "删除成功" });
} 