import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // 复制项目
  const supabase = createClient();
  const { id, user_id } = await req.json();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  const newTitle = `${project.title}01`;
  const { data, error } = await supabase.from("projects").insert([{ ...project, id: undefined, title: newTitle, created_at: new Date(), updated_at: new Date() }]).select();
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(data[0]);
} 