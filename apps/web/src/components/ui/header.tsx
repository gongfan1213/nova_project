"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useModel } from "@/contexts/ModelContext";

// 动态引入模型选择器，避免SSR问题
const ModelSelector = dynamic(() => import("@/components/chat-interface/model-selector"), { ssr: false });
// 动态引入ThreadHistory，避免SSR问题
const ThreadHistory = dynamic(() => import("@/components/chat-interface/thread-history").then(mod => mod.ThreadHistory), { ssr: false });

export function Header() {
  const pathname = usePathname();
  const { modelName, setModelName, modelConfig, setModelConfig, modelConfigs } = useModel();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-0 sticky top-0 z-30">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full h-16">
        {/* 左侧对话历史图标 */}
        <div className="flex items-center">
          <ThreadHistory switchSelectedThreadCallback={() => {}} />
          <TighterText className="text-xl font-bold">Nova</TighterText>
        </div>
        {/* 中间导航 */}
        <nav className="flex items-center space-x-8 flex-1 justify-center">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "relative px-4 py-8 text-gray-700 hover:text-gray-900 bg-transparent hover:bg-transparent",
                pathname === "/"
                  ? "text-gray-900 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-500 after:opacity-100"
                  : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-300 after:opacity-0 hover:after:opacity-100"
              )}
            >
              首页
            </Button>
          </Link>
          <Link href="/my-projects">
            <Button
              variant="ghost"
              className={cn(
                "relative px-4 py-8 text-gray-700 hover:text-gray-900 bg-transparent hover:bg-transparent",
                pathname === "/my-projects"
                  ? "text-gray-900 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-500 after:opacity-100"
                  : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-300 after:opacity-0 hover:after:opacity-100"
              )}
            >
              我的项目
            </Button>
          </Link>
        </nav>
        {/* 右侧模型选择器和N图标 */}
        <div className="flex items-center space-x-4">
          {/* <div className="min-w-[180px]">
            <ModelSelector
              modelName={modelName}
              setModelName={setModelName}
              modelConfig={modelConfig}
              setModelConfig={setModelConfig}
              modelConfigs={modelConfigs}
            />
          </div> */}
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center ml-2">
            <TighterText className="text-xl font-bold text-white">N</TighterText>
          </div>
        </div>
      </div>
    </header>
  );
}

// 保留原有 TighterText
export function TighterText({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("tracking-tighter", className)}>{children}</p>;
}
