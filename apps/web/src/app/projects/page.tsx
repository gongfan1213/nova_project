"use client";

import { useState, useEffect, useMemo } from "react";
import { Edit3, Copy, Trash2, Tag as TagIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { useRouter } from "next/navigation";

const MyProjects = () => {
  const router = useRouter();
  const { userThreads, isUserThreadsLoading, getUserThreads, deleteThread } =
    useThreadContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");

  useEffect(() => {
    console.log("hans-p-userThreads", userThreads);
  }, [userThreads]);

  // 防抖处理搜索查询
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 单个项目删除
  const handleDeleteProject = async (projectId: string) => {
    deleteThread(projectId, () => {
      console.log("hans-p-deleteThread", projectId);
      getUserThreads();
    });
  };

  // 复制项目
  const handleCopyProject = async (thread: any) => {
    console.log(
      "hans-p-thread",
      thread?.values?.artifact?.contents?.[0]?.fullMarkdown
    );
  };

  const filteredProjects = useMemo(() => {
    return userThreads.filter((thread: any) => {
      const matchesSearch =
        debouncedSearchQuery === "" ||
        thread?.metadata?.thread_title
          ?.toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        thread?.values?.artifact?.contents?.[0]?.fullMarkdown
          ?.toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase());
      const matchesFilter = activeFilter === "全部";
      return matchesSearch && matchesFilter;
    });
  }, [userThreads, debouncedSearchQuery, activeFilter]);

  if (isUserThreadsLoading) {
    // 骨架屏 全是卡片
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 py-10 max-w-7xl mx-auto px-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="h-24 bg-gray-200 rounded-t-xl"></CardHeader>
            <CardContent className="h-24 bg-gray-200 rounded-b-xl"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="pl-10 py-3 text-base text-gray-400 border-gray-200 focus:border-red-500 placeholder:text-gray-300"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3 shadow-sm mb-6"></div>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProjects.map((thread) => (
              <Card
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/?threadId=${thread.thread_id}`);
                }}
                key={thread.thread_id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-md group w-full max-w-[300px] min-w-[220px] mx-auto rounded-3xl h-[260px] flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-base font-semibold text-gray-900 transition-colors flex-1 group-hover:text-red-600 line-clamp-2 break-all min-h-[48px] flex items-start">
                      {thread.metadata.thread_title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col h-full">
                  <p className="text-gray-600 mb-4 leading-relaxed min-h-[72px] max-h-[72px] overflow-hidden line-clamp-3 break-all flex items-start">
                    {thread?.values?.artifact?.contents?.[0]?.fullMarkdown}
                  </p>
                  <div className="flex items-center justify-between mb-2 mt-auto">
                    <div className="flex items-center justify-between w-full ">
                      <span className="text-xs text-gray-500 group-hover:hidden">
                        最后修改:{" "}
                        {thread.updated_at
                          ? thread.updated_at.slice(0, 10)
                          : ""}
                      </span>
                    </div>
                    <div className="hidden group-hover:flex items-center justify-end w-full space-x-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/?threadId=${thread.thread_id}`);
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50"
                        onClick={() => handleCopyProject(thread)}
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteProject(thread.thread_id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-[calc(100vh-300px)] w-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-300 mb-6">暂无项目</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyProjects;