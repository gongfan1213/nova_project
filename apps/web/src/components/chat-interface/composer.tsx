"use client";

import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { type FC, useState, useEffect } from "react";

import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { ArrowUp } from "lucide-react";
import { DragAndDropWrapper } from "./drag-drop-wrapper";
import { ComposerAttachments } from "../assistant-ui/attachment";
import { ComposerActionsPopOut } from "./composer-actions-popout";
import { useGraphContext } from "@/contexts/GraphContext";

const GENERIC_PLACEHOLDERS = [
  "分享你的灵感，让内容闪耀全场",
  "写下你的创意，开启爆款之路",
  "你的故事，从这里开始",
  "今天想和大家聊点什么？",
  "输入想法，生成专属内容",
  "让你的内容成为下一个热门",
  "记录生活点滴，发现更多美好",
  "大胆表达，灵感无限",
  "用文字点亮你的社交圈",
  "让创意在这里生根发芽",
];

const SEARCH_PLACEHOLDERS = [
  "输入话题，获取新鲜灵感",
  "写下你的想法，AI帮你补充内容",
  "你的创意+我的助力=爆款内容",
  "从这里开始，发现更多趋势",
  "输入主题，生成高质量内容",
  "用AI丰富你的内容库",
  "让每一次分享都与众不同",
  "灵感随时捕捉，创作不设限",
  "你的故事，我来助力",
  "用AI点亮你的内容世界",
];

const getRandomPlaceholder = (searchEnabled: boolean) => {
  return searchEnabled
    ? SEARCH_PLACEHOLDERS[
        Math.floor(Math.random() * SEARCH_PLACEHOLDERS.length)
      ]
    : GENERIC_PLACEHOLDERS[
        Math.floor(Math.random() * GENERIC_PLACEHOLDERS.length)
      ];
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};

interface ComposerProps {
  chatStarted: boolean;
  userId: string | undefined;
  searchEnabled: boolean;
}

export const Composer: FC<ComposerProps> = (props: ComposerProps) => {
  const [placeholder, setPlaceholder] = useState("");
  const {
    graphData: { searchEnabled, setSearchEnabled },
  } = useGraphContext();

  useEffect(() => {
    setPlaceholder(getRandomPlaceholder(props.searchEnabled));
  }, [props.searchEnabled]);

  return (
    <DragAndDropWrapper>
      <ComposerPrimitive.Root className="flex flex-col w-full justify-center items-center">
        {/* 附件显示区域 */}
        <div className="w-full flex flex-wrap gap-2 items-start mb-2">
          <ComposerAttachments />
        </div>

        {/* 主输入区域 */}
        <div className="w-full rounded-3xl bg-white border border-gray-200 hover:border-[#1a1a1a] px-4 py-3 text-[#454C53] text-base flex items-center cursor-pointer transition min-w-0 flex-col shadow-[0px_4px_40px_0px_#C1C1C140]">
          {/* 输入框 */}
          <ComposerPrimitive.Input
            autoFocus
            placeholder={placeholder}
            rows={1}
            className="w-full placeholder:text-gray-400 resize-none border-none bg-transparent px-0 py-1 text-base outline-none focus:ring-0 disabled:cursor-not-allowed min-h-[24px] text-[#454C53]"
          />
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-2">
              {/* <ComposerPrimitive.AddAttachment asChild>
                <TooltipIconButton
                  tooltip="Add attachment"
                  variant="ghost"
                  className="size-9 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Plus className="size-4 text-gray-600" />
                </TooltipIconButton>
              </ComposerPrimitive.AddAttachment>

              <TooltipIconButton
                tooltip="Web search"
                variant="ghost"
                className={`size-9 rounded-full hover:bg-gray-100 transition-colors duration-200 ${
                  searchEnabled ? "bg-blue-100 text-blue-600" : ""
                }`}
                onClick={() => setSearchEnabled((p) => !p)}
              >
                <Globe
                  className={`size-4 ${searchEnabled ? "text-blue-600" : "text-gray-600"}`}
                />
              </TooltipIconButton> */}
            </div>
            {/* 发送按钮 */}
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send"
                  variant="default"
                  className="size-8 mt-4 rounded-[12px] bg-[#6d6d6d] hover:bg-[#5a5a5a] transition-colors duration-200"
                >
                  <ArrowUp className="size-4 text-white" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
          </div>

          {/* 取消按钮 */}
          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <TooltipIconButton
                tooltip="Cancel"
                variant="default"
                className="size-8 rounded-full bg-[#6d6d6d] hover:bg-[#5a5a5a] transition-colors duration-200"
              >
                <div className="text-white">
                  <CircleStopIcon />
                </div>
              </TooltipIconButton>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </div>
      </ComposerPrimitive.Root>
    </DragAndDropWrapper>
  );
};
