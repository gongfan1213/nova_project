"use client";

import { useState, useEffect } from "react";
import { Edit3, Copy, Trash2, Tag as TagIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import styles from "@/styles/MyProjects.module.css";
// import Header from "@/components/Header";
import NewProjectDialog from "@/components/NewProjectDialog";
import ProjectManageDialog from "@/components/ProjectManageDialog";
import NewTagDialog from "@/components/NewTagDialog";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const MyProjects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [tags, setTags] = useState<string[]>(["全部"]);
  const [projects, setProjects] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createSupabaseClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState<string | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [tagEditProjectId, setTagEditProjectId] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // 拉取标签
  const fetchTags = async () => {
    if (!userId) return;
    const { data } = await supabase.from('tags').select('name').eq('user_id', userId);
    setTags(['全部', ...(data?.map(t => t.name) || [])]);
  };
  // 拉取项目（改为 threads/artifacts/artifact_contents 三级联查）
  const fetchProjects = async () => {
    if (!userId) return;
    console.log('当前userId:', userId);
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        id,
        title,
        status,
        tags,
        updated_at,
        artifacts (
          id,
          artifact_contents (
            id,
            full_markdown,
            code,
            index
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('threads查询出错:', error);
    }
    console.log('threads原始数据:', threads);
    const projects = (threads || []).map(thread => {
      const artifact = thread.artifacts?.[0];
      const content = artifact?.artifact_contents?.[0];
      const desc = content?.full_markdown || content?.code || '';
      return {
        id: thread.id,
        title: thread.title || '',
        status: thread.status || '草稿',
        tags: thread.tags || '',
        updated_at: thread.updated_at,
        description: desc.slice(0, 20),
      };
    });
    setProjects(projects);
    console.log('所有项目标题:', projects.map(p => p.title));
  };

  useEffect(() => { if (userId) { fetchTags(); fetchProjects(); } }, [userId]);

  // 拉取所有标签
  const fetchAllTags = async () => {
    if (!userId) return;
    const { data } = await supabase.from('tags').select('name').eq('user_id', userId);
    setAllTags(data?.map(t => t.name) || []);
  };

  // 打开标签弹窗时初始化
  const openTagDialog = (project: any) => {
    setTagDialogOpen(project.id);
    setTagEditProjectId(project.id);
    setSelectedTags((project.tags || '').split(',').filter(Boolean));
    setTagSearch('');
    setNewTag('');
    fetchAllTags();
  };

  const handleSelectTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async () => {
    const tag = newTag.trim();
    if (!tag || allTags.includes(tag)) return;
    await supabase.from('tags').insert([{ name: tag, user_id: userId }]);
    setAllTags([...allTags, tag]);
    setSelectedTags([...selectedTags, tag]);
    setNewTag('');
  };

  const handleDeleteTag = async (tag: string) => {
    await supabase.from('tags').delete().eq('user_id', userId).eq('name', tag);
    setAllTags(allTags.filter(t => t !== tag));
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSaveTags = async () => {
    if (!tagEditProjectId) return;
    await supabase.from('threads').update({ tags: selectedTags.join(',') }).eq('id', tagEditProjectId);
    setTagDialogOpen(null);
    fetchProjects();
  };

  // 单个项目删除
  const handleDeleteProject = async (projectId: string) => {
    await supabase.from("threads").delete().eq("id", projectId);
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
      .eq("user_id", userId)
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
        user_id: userId,
      },
    ]);
    fetchProjects();
  };

  // 修改项目状态
  const handleStatusChange = async (projectId: string, newStatus: string) => {
    await supabase.from('threads').update({ status: newStatus }).eq('id', projectId)
    setStatusDialogOpen(null)
    fetchProjects()
  }

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
            {/* <div className="flex flex-wrap gap-2">
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
            </div> */}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  {editingTitle === project.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-base font-semibold text-gray-900 transition-colors flex-1"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="text-base font-semibold text-gray-900 transition-colors flex-1 group-hover:text-red-600"
                    >
                      {project.title}
                    </CardTitle>
                  )}
                  <Dialog open={statusDialogOpen === project.id} onOpenChange={open => setStatusDialogOpen(open ? project.id : null)}>
                    <DialogTrigger asChild>
                      <Badge
                        className={
                          (project.status === '已完成'
                            ? 'bg-green-100 text-green-800'
                            : project.status === '进行中'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800') + ' cursor-pointer'
                        }
                      >
                        {project.status}
                      </Badge>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>更改项目状态</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          className="py-2 rounded bg-yellow-100 text-yellow-800 font-medium hover:bg-yellow-200"
                          onClick={() => handleStatusChange(project.id, '草稿')}
                        >草稿</button>
                        <button
                          className="py-2 rounded bg-blue-100 text-blue-800 font-medium hover:bg-blue-200"
                          onClick={() => handleStatusChange(project.id, '进行中')}
                        >进行中</button>
                        <button
                          className="py-2 rounded bg-green-100 text-green-800 font-medium hover:bg-green-200"
                          onClick={() => handleStatusChange(project.id, '已完成')}
                        >已完成</button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3 min-h-[64px] max-h-[72px] overflow-hidden">
                  {project.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-between w-full ">
                    <span className="text-xs text-gray-500 group-hover:hidden">
                      最后修改: {project.updated_at ? project.updated_at.slice(0, 10) : ""}
                    </span>
                    {/* <span className="flex gap-1 ml-2 items-center">
                      {(project.tags || '').split(',').filter(Boolean).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className={
                            'px-2 py-0.5 rounded text-xs font-medium cursor-pointer ' +
                            (tag === '未分类'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-red-100 text-red-800')
                          }
                          onClick={() => openTagDialog(project)}
                        >
                          {tag}
                        </span>
                      ))}
                      <Dialog open={tagDialogOpen === project.id} onOpenChange={open => setTagDialogOpen(open ? project.id : null)}>
                        <DialogContent className="max-w-xl min-w-[480px]">
                          <DialogHeader>
                            <DialogTitle>管理项目标签</DialogTitle>
                          </DialogHeader>
                          <input
                            className="w-full border rounded px-3 py-2 mb-4 text-sm"
                            placeholder="搜索标签..."
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                          />
                          <div className="mb-4 flex flex-wrap gap-3">
                            {selectedTags.map(tag => (
                              <span
                                key={tag}
                                className="relative bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-medium cursor-pointer flex items-center"
                                onClick={() => handleSelectTag(tag)}
                                style={{ minWidth: 60 }}
                              >
                                {tag}
                                <span
                                  className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 text-base cursor-pointer bg-white rounded-full shadow"
                                  onClick={e => { e.stopPropagation(); handleSelectTag(tag); }}
                                  title="移除标签"
                                >
                                  ×
                                </span>
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto mb-4">
                            {allTags.filter(tag => tag.includes(tagSearch)).map(tag => (
                              <span
                                key={tag}
                                className={
                                  'relative px-3 py-1 rounded text-sm font-medium cursor-pointer flex items-center ' +
                                  (selectedTags.includes(tag)
                                    ? 'bg-red-100 text-red-800'
                                    : tag === '未分类'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-gray-50 text-gray-700 hover:bg-red-50')
                                }
                                onClick={() => handleSelectTag(tag)}
                                style={{ minWidth: 60 }}
                              >
                                {tag}
                                <span
                                  className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-red-500 text-base cursor-pointer bg-white rounded-full shadow"
                                  onClick={e => { e.stopPropagation(); handleDeleteTag(tag); }}
                                  title="删除标签"
                                >
                                  ×
                                </span>
                              </span>
                            ))}
                            {allTags.filter(tag => tag.includes(tagSearch)).length === 0 && <span className="text-xs text-gray-400">暂无标签</span>}
                          </div>
                          <div className="flex gap-2 mb-6">
                            <input
                              className="flex-1 border rounded px-2 py-2 text-sm"
                              placeholder="新建标签"
                              value={newTag}
                              onChange={e => setNewTag(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                            />
                            <button className="bg-red-500 text-white px-4 py-2 rounded text-sm flex items-center gap-1" onClick={handleCreateTag}>
                              <Plus size={16} /> 新建
                            </button>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button className="px-5 py-2 rounded border text-base" onClick={() => setTagDialogOpen(null)}>取消</button>
                            <button className="px-5 py-2 rounded bg-red-500 text-white text-base" onClick={handleSaveTags}>保存</button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </span> */}
                  </div>
                  <div className="hidden group-hover:flex items-center justify-end w-full space-x-1">
                    <Link href={`/?threadId=${project.id}`}>
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