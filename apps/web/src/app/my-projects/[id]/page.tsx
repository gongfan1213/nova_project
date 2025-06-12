"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Plus } from "lucide-react";
import Link from "next/link";

interface XiaohongshuArticle {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  updated_at: string;
}

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [articles, setArticles] = useState<XiaohongshuArticle[]>([]);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProjectAndArticles = async () => {
      // 获取项目信息
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .single();

      // 获取关联的小红书文章
      const { data: articlesData } = await supabase
        .from("project_xiaohongshu_articles")
        .select("*")
        .eq("project_id", params.id)
        .order("updated_at", { ascending: false });

      setProject(projectData);
      setArticles(articlesData || []);
    };

    fetchProjectAndArticles();
  }, [params.id]);

  if (!project) return <div>加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 项目标题和操作按钮 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <div className="flex gap-4">
            <Link href={`/editor/${project.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit3 size={16} />
                编辑项目
              </Button>
            </Link>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              新建小红书文章
            </Button>
          </div>
        </div>

        {/* 项目描述 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>项目描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{project.description}</p>
          </CardContent>
        </Card>

        {/* 关联的小红书文章列表 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">关联的小红书文章</h2>
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{article.title}</h3>
                  <Badge
                    className={
                      article.status === "已完成"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {article.status}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{article.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>最后更新: {article.updated_at?.slice(0, 10)}</span>
                  <Badge variant="outline" className="text-gray-600 border-gray-300">
                    {article.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 