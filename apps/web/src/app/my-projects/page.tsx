"use client";

import { useState, useEffect } from "react";
import { Edit3, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import styles from "@/styles/MyProjects.module.css";
// import Header from "@/components/Header";
import NewProjectDialog from "@/components/NewProjectDialog";
import ProjectManageDialog from "@/components/ProjectManageDialog";
import NewTagDialog from "@/components/NewTagDialog";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();
const USER_ID = "f53ad801-aeef-4d39-9dbc-4042717ee508";

const MyProjects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // const [tags, setTags] = useState(["全部", "科技", "传媒", "灯", "生活方式", "美妆", "旅行"]);
  const [tags, setTags] = useState<string[]>(["全部"]);

  // const [projects, setProjects] = useState([
  //   { id: "1", title: "iPhone 15 Pro深度评测", description: "全面解析iPhone 15 Pro的设计、性能、摄影等特性，为用户提供购买决策建议", status: "已完成", category: "科技", lastModified: "2024-06-06", statusColor: "bg-green-100 text-green-800" },
  //   { id: "2", title: "夏日护肤攻略", description: "分享夏季护肤的关键要点，推荐适合的护肤产品和防晒步骤", status: "草稿", category: "美妆", lastModified: "2024-06-05", statusColor: "bg-yellow-100 text-yellow-800" },
  //   { id: "3", title: "职场新人必备指南", description: "为初入职场的新人提供实用建议，包括工作技巧、人际关系等", status: "进行中", category: "灯", lastModified: "2024-06-04", statusColor: "bg-blue-100 text-blue-800" },
  //   { id: "4", title: "成都美食探店", description: "探索成都地道美食，分享隐藏的美食店铺和特色菜品", status: "已完成", category: "旅行", lastModified: "2024-06-03", statusColor: "bg-green-100 text-green-800" }
  // ]);
  const [projects, setProjects] = useState<any[]>([]);

  // 拉取标签
  const fetchTags = async () => {
    const { data } = await supabase.from("tags").select("name").eq("user_id", USER_ID);
    setTags(["全部", ...(data?.map(t => t.name) || [])]);
  };
  // 拉取项目
  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("*").eq("user_id", USER_ID).order("created_at", { ascending: false });
    setProjects(data || []);
  };

  useEffect(() => { fetchTags(); fetchProjects(); }, []);

  // 删除标签
  const handleDeleteTag = async (tagName: string) => {
    await supabase.from("tags").delete().eq("user_id", USER_ID).eq("name", tagName);
    fetchTags();
  };

  // 单个项目删除
  const handleDeleteProject = async (projectId: string) => {
    await supabase.from("projects").delete().eq("id", projectId);
    fetchProjects();
  };

  // 新增项目
  const handleAddProject = (title: string, description: string, category: string) => {
    // ...原有本地新增逻辑注释掉
    // const newProject = { ... };
    // setProjects([newProject, ...projects]);
    // 这里建议直接调用API后刷新fetchProjects
  };

  // 新增标签
  const handleAddTag = (newTag: string) => {
    // if (!tags.includes(newTag)) {
    //   setTags([...tags, newTag]);
    // }
    // 这里建议直接调用API后刷新fetchTags
  };

  // 复制项目
  const handleCopyProject = async (project: any) => {
    // 查找当前数据库中以该标题开头的项目数量，生成新标题
    const { data: sameTitleProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", USER_ID)
      .like("title", `${project.title}%`);
    let newTitle = project.title + "01";
    if (sameTitleProjects && sameTitleProjects.length > 0) {
      const count = sameTitleProjects.length + 1;
      newTitle = project.title + count.toString().padStart(2, "0");
    }
    await supabase.from("projects").insert([
      {
        title: newTitle,
        description: project.description,
        content: project.content,
        status: project.status,
        tags: project.tags,
        category: project.category,
        user_id: USER_ID,
      },
    ]);
    fetchProjects();
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "全部" || project.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "已完成":
        return "bg-green-100 text-green-800";
      case "草稿":
        return "bg-yellow-100 text-yellow-800";
      case "进行中":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header /> */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="pl-10 py-3 text-base text-gray-400 border-gray-200 focus:border-red-500 placeholder:text-gray-300"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3 shadow-sm mb-6">
            <div className="flex flex-wrap gap-2">
              {tags.map((filter) => (
                <div key={filter} className="relative group">
                  <Button
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className={
                      "rounded-full px-5 py-2 text-base font-medium transition-all duration-150 " +
                      (activeFilter === filter
                        ? "bg-red-500 hover:bg-red-600 text-white shadow"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:shadow")
                    }
                  >
                    {filter}
                  </Button>
                  {filter !== "全部" && (
                    <span
                      className="absolute -top-2 -right-2 hidden group-hover:inline-block cursor-pointer text-xs text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteTag(filter)}
                    >✕</span>
                  )}
                </div>
              ))}
              <NewTagDialog onTagCreated={fetchTags} />
            </div>
            <div className="flex gap-3">
              <NewProjectDialog onProjectCreated={fetchProjects} availableTags={tags} />
              <ProjectManageDialog projects={projects} onProjectsChanged={fetchProjects} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  {editingTitle === project.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      // onBlur={handleTitleSave}
                      // onKeyDown={handleTitleKeyPress}
                      className="text-base font-semibold text-gray-900 transition-colors flex-1"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="text-base font-semibold text-gray-900 transition-colors flex-1 group-hover:text-red-600"
                      // onDoubleClick={() => handleTitleDoubleClick(project.id, project.title)}
                    >
                      {project.title}
                    </CardTitle>
                  )}
                  <Badge className={`${getStatusColor(project.status)} border-0 ml-2`}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 min-h-[64px] max-h-[72px] overflow-hidden">
                  {project.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-between w-full group-hover:hidden">
                    <span className="text-xs text-gray-500">
                      最后修改: {project.updated_at ? project.updated_at.slice(0, 10) : ""}
                    </span>
                    <Badge variant="outline" className="text-gray-600 border-gray-300">
                      {project.category}
                    </Badge>
                  </div>
                  <div className="hidden group-hover:flex items-center justify-end w-full space-x-1">
                    <Link href={`/editor/${project.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50">
                        <Edit3 size={14} />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50" onClick={() => handleCopyProject(project)}>
                      <Copy size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteProject(project.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MyProjects; 