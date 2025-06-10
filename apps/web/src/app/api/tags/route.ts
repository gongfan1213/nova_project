import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // 获取标签
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
  const { data, error } = await supabase.from("tags").select("*").eq("user_id", user_id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // 新增标签
  const supabase = createClient();
  const { name, user_id } = await req.json();
  const { data, error } = await supabase.from("tags").insert([{ name, user_id }]).select();
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data[0]);
}

export async function DELETE(req: NextRequest) {
  // 删除标签
  const supabase = createClient();
  const { id } = await req.json();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ message: "删除成功" });
} 