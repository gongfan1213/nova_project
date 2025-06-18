"use client";

import React, { useState, useEffect } from "react";
import { HomeIcon, FolderIcon, User } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export const FloatingSidebar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 根据当前路径设置激活状态
  useEffect(() => {
    if (pathname === "/") {
      setActiveIndex(0);
    } else if (pathname.startsWith("/projects")) {
      setActiveIndex(1);
    } else if (pathname === "/profile") {
      setActiveIndex(2);
    }
  }, [pathname]);
  
  const navItems = [
    {
      icon: () => <HomeIcon />,
      label: "Home",
      onClick: () => {
        router.push("/");
      },
    },
    {
      icon: () => <FolderIcon />,
      label: "Projects",
      onClick: () => {
        router.push("/projects");
      },
    },
    {
      icon: () => <User />,
      label: "Profile",
      onClick: () => {
        router.push("/profile");
      },
    },
  ];

  // 有threadId时隐藏
  const threadId = useSearchParams().get("threadId");
  if (threadId) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300} key={threadId}>
      <div className="fixed left-[24px] top-1/2 transform -translate-y-1/2 z-50 mt-0 flex flex-col items-center">
        {/* 主导航容器 */}
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-full bg-white p-1"
          style={{ boxShadow: "rgba(193, 193, 193, 0.25) 0px 4px 40px 0px" }}
        >
          {navItems.map((item, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer transition-colors duration-200 ${
                    activeIndex === index
                      ? "bg-[#2F3640] text-[#fff]"
                      : "hover:bg-[#F2F3F5] text-[#2F3640]"
                  }`}
                  onClick={item.onClick}
                >
                  <item.icon />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="z-[9999] bg-[#2F3640] text-white px-3 py-2 rounded-lg text-sm border-none shadow-lg"
                sideOffset={12}
              >
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* 菜单按钮 */}
        {/* <div
        className="group mt-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white transition-colors duration-200"
        style={{ boxShadow: "rgba(193, 193, 193, 0.25) 0px 4px 40px 0px" }}
        onMouseEnter={() => setIsMenuHovered(true)}
        onMouseLeave={() => setIsMenuHovered(false)}
      >
        {!isMenuHovered ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
            className="h-4 w-4"
          >
            <path
              stroke="#2F3640"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M14.167 10H5.833m10 5H4.167M17.5 5h-15"
            ></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
            className="h-4 w-4"
          >
            <path
              stroke="#2F3640"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M17.5 10h-15m15 5h-15m15-10h-15"
            ></path>
          </svg>
        )}
             </div> */}
      </div>
    </TooltipProvider>
  );
};
