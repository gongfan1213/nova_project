"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon, LogOutIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useModel } from "@/contexts/ModelContext";
import { useUserContext } from "@/contexts/UserContext";
import { useThreadContext } from "@/contexts/ThreadProvider";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SKIP_AUTH } from "@/lib/auth-config";

// 动态引入模型选择器，避免SSR问题
const ModelSelector = dynamic(() => import("@/components/chat-interface/model-selector"), { ssr: false });
// 动态引入ThreadHistory，避免SSR问题
const ThreadHistory = dynamic(() => import("@/components/chat-interface/thread-history").then(mod => mod.ThreadHistory), { ssr: false });

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserContext();
  const { threadId } = useThreadContext();
  const { modelName, setModelName, modelConfig, setModelConfig, modelConfigs } = useModel();

  const handleLogout = async () => {
    if (SKIP_AUTH) {
      // 跳过认证模式下，直接刷新页面
      window.location.reload();
      return;
    }

    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使出错也重定向到首页
      router.push('/');
    }
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-0 sticky top-0 z-30">
      <div className="flex items-center justify-between mx-auto w-full h-16">
        {/* 左侧对话历史图标 */}
        <div className="flex items-center">
          <div className="hidden">
            <ThreadHistory switchSelectedThreadCallback={() => {}} />
          </div>
          <a className="text-gray-700 hover:text-gray-900" href="/">
            <span
              style={{
                backgroundClip: "text",
                backgroundImage:
                  "linear-gradient(to right, #8B5CF6, #4F6BF2, #D946EF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "bold",
                fontSize: "24px",
                lineHeight: "1",
                letterSpacing: "0.05em",
              }}
              className=""
            >
              Nova
            </span>
          </a>
        </div>
        {/* 中间导航 - 当有threadId时隐藏 */}
        <nav className={cn(
          "flex items-center space-x-8 flex-1 justify-center",
          threadId && "hidden"
        )}>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center ml-2 p-0 hover:bg-red-600 transition-colors"
              >
                <TighterText className="text-xl font-bold text-white">
                  N
                </TighterText>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm text-gray-500 truncate">
                {user?.email || "Guest User"}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleProfileClick}
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                退出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
