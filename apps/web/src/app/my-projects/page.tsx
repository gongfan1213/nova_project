"use client";

import { useState } from "react";
import { Edit3, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import styles from "@/styles/MyProjects.module.css";
// import Header from "@/components/Header";
// import NewProjectDialog from "@/components/NewProjectDialog";
// import ProjectManageDialog from "@/components/ProjectManageDialog";
// import NewTagDialog from "@/components/NewTagDialog";
import Link from "next/link";

const MyProjects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [tags, setTags] = useState(["全部", "科技", "传媒", "灯", "生活方式", "美妆", "旅行"]);

  const [projects, setProjects] = useState([
    {
      id: "1",
      title: "iPhone 15 Pro深度评测",
      description: "全面解析iPhone 15 Pro的设计、性能、摄影等特性，为用户提供购买决策建议",
      status: "已完成",
      category: "科技",
      lastModified: "2024-06-06",
      statusColor: "bg-green-100 text-green-800"
    },
    {
      id: "2",
      title: "夏日护肤攻略",
      description: "分享夏季护肤的关键要点，推荐适合的护肤产品和防晒步骤",
      status: "草稿",
      category: "美妆",
      lastModified: "2024-06-05",
      statusColor: "bg-yellow-100 text-yellow-800"
    },
    {
      id: "3",
      title: "职场新人必备指南",
      description: "为初入职场的新人提供实用建议，包括工作技巧、人际关系等",
      status: "进行中",
      category: "灯",
      lastModified: "2024-06-04",
      statusColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "4",
      title: "成都美食探店",
      description: "探索成都地道美食，分享隐藏的美食店铺和特色菜品",
      status: "已完成",
      category: "旅行",
      lastModified: "2024-06-03",
      statusColor: "bg-green-100 text-green-800"
    }
  ]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "全部" || project.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // 省略新增/删除/编辑等函数，后续可补充

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">标签分类</span>
              <div className="flex flex-wrap gap-2">
                {tags.map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className={
                      activeFilter === filter
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  >
                    {filter}
                  </Button>
                ))}
                {/* <NewTagDialog onAddTag={handleAddTag} /> */}
              </div>
            </div>
            <div className="flex space-x-3">
              {/* <NewProjectDialog onAddProject={handleAddProject} availableTags={tags} onAddTag={handleAddTag} /> */}
              {/* <ProjectManageDialog projects={projects} onDeleteProjects={handleDeleteProjects} /> */}
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
                  <Badge className={`${project.statusColor} border-0 ml-2`}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-between w-full group-hover:hidden">
                    <span className="text-xs text-gray-500">
                      最后修改: {project.lastModified}
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
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50">
                      <Copy size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50">
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