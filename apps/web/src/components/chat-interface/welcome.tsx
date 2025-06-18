import React from 'react'
import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime, useComposerRuntime, useComposer } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo } from "react";
import { TighterText } from "../ui/header";
import { ArrowUp } from "lucide-react";
import { ProgrammingLanguagesDropdown } from "../ui/programming-lang-dropdown";
import { Button } from "../ui/button";
import { ChineseFeatureCards } from "./ChineseFeatureCards";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const QUICK_START_PROMPTS_SEARCH = [
  "Write a market analysis of AI chip manufacturers in 2025",
  "Create a blog post about the latest climate change policies and their impact",
  "Draft an investor update on renewable energy trends this quarter",
  "Write a report on current cybersecurity threats in cloud computing",
  "Analyze the latest developments in quantum computing for a tech newsletter",
  "Create a summary of emerging medical breakthroughs in cancer treatment",
  "Write about the impact of current interest rates on the housing market",
  "Draft an article about breakthroughs in battery technology this year",
  "Analyze current supply chain disruptions in semiconductor manufacturing",
  "Write about how recent AI regulations affect business innovation",
];

const QUICK_START_PROMPTS = [
  "Write a bedtime story about a brave little robot",
  "Create a function to calculate Fibonacci numbers in TypeScript",
  "Draft a resignation letter for a position I've had for 2 years",
  "Build a simple weather dashboard using React and Tailwind",
  "Write a poem about artificial intelligence",
  "Create a basic Express.js REST API with two endpoints",
  "Draft a congratulatory speech for my sister's graduation",
  "Build a command-line calculator in Python",
  "Write instructions for making perfect scrambled eggs",
  "Create a simple snake game using HTML canvas",
  "Write me a TODO app in React",
  "Explain why the sky is blue in a short essay",
  "Help me draft an email to my professor Craig",
  "Write a web scraping program in Python",
];

function getRandomPrompts(prompts: string[], count: number = 4): string[] {
  return [...prompts].sort(() => Math.random() - 0.5).slice(0, count);
}

interface QuickStartButtonsProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
  searchEnabled: boolean;
}

interface QuickStartPromptsProps {
  searchEnabled: boolean;
}

const QuickStartPrompts = ({ searchEnabled }: QuickStartPromptsProps) => {
  const threadRuntime = useThreadRuntime();

  const handleClick = (text: string) => {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text }],
    });
  };

  const selectedPrompts = useMemo(
    () =>
      getRandomPrompts(
        searchEnabled ? QUICK_START_PROMPTS_SEARCH : QUICK_START_PROMPTS
      ),
    [searchEnabled]
  );

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* {selectedPrompts.map((prompt, index) => (
          <Button
            key={`quick-start-prompt-${index}`}
            onClick={() => handleClick(prompt)}
            variant="outline"
            className="min-h-[60px] w-full flex items-center justify-center p-6 whitespace-normal text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl"
          >
            <p className="text-center break-words text-sm font-normal">
              {prompt}
            </p>
          </Button>
        ))} */}
      </div>
    </div>
  );
};

const QuickStartButtons = (props: QuickStartButtonsProps) => {
  const handleLanguageSubmit = (language: ProgrammingLanguageOptions) => {
    props.handleQuickStart("code", language);
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center w-full">
      <div className="flex flex-col gap-6">
        <p className="text-gray-600 text-sm">将你的想法转化为精彩内容 - 从这里开始</p>
        {/* <div className="flex flex-row gap-1 items-center justify-center w-full">
          <Button
            variant="outline"
            className="text-gray-500 hover:text-gray-700 transition-colors ease-in rounded-2xl flex items-center justify-center gap-2 w-[250px] h-[64px]"
            onClick={() => props.handleQuickStart("text")}
          >
            New Markdown
            <NotebookPen />
          </Button>
          <ProgrammingLanguagesDropdown handleSubmit={handleLanguageSubmit} />
        </div> */}
      </div>
      <div className="flex flex-col gap-6 mt-2 w-full">
        {/* <p className="text-gray-600 text-sm">or with a message</p> */}
        {props.composer}
        <QuickStartPrompts searchEnabled={props.searchEnabled} />
      </div>
    </div>
  );
};

interface ThreadWelcomeProps {
  handleQuickStart: (
    type: "text" | "code",
    language?: ProgrammingLanguageOptions
  ) => void;
  composer: React.ReactNode;
  searchEnabled: boolean;
}

// 内容建议卡片数据
const contentSuggestions = [
  [
    "拆解小水水最新爆款视频的拍摄逻辑和分镜",
    "如何快速起号？给我一个爆款Vlog拍摄脚本",
  ],
  // [
  //   '现在有一款产品是带有白松香和广藿香香调的氨基酸沐浴露，主打"闻起来像高级香水"。请给我一个该产品小红书种草帖子的封面图拍摄建议',
  //   '如何快速起号？给我一个爆款Vlog拍摄脚本',
  // ],
];

// 新内容卡片数据
const novaContentCards = [
  {
    userName: '吃货小仙女',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    title: '爆款泰国小吃种草文案',
    desc: 'AI 匠心打造泰国小吃种草文案！融合专业美食知识与真实探店体验，生动描绘特色口感，带你穿梭夜市与餐厅，沉浸式领略东南亚风味魅力！',
    prompt: '请模拟美食账号，写一条描述泰国小吃的爆款文案',
  },
  {
    userName: '心理咨询师小陈',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    title: '家庭创伤主题的结尾文案',
    desc: 'AI 以心理学视角剖析原生家庭创伤，融入真实故事与感悟，用温暖文字带你直面隐痛。每个细节满含关怀，开启自我疗愈之旅！',
    prompt: '请生成一组"原生家庭痛苦"话题的结尾文案，要有代入感，能引导点赞/收藏',
  },
  {
    userName: '影视达人Leo',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    title: '找到电影行业热点选题',
    desc: 'AI将精准聚焦电影行业最新热点，详细拆解背后逻辑，捕捉创作巧思，发现最佳选题，帮助你打造超吸睛的小红书内容！',
    prompt: '帮我从电影行业热点中挖掘一个符合小红书平台的内容选题并生成五篇文案',
  },
  {
    userName: '猫奴日记',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80',
    title: '爆款宠物选题推荐',
    desc: 'AI将结合你宠物的具体特点，帮你挖掘用户痛点和宠物的萌点密码，结合宠物专业知识，帮你找到让人忍不住点赞收藏的爆款选题',
    prompt: '我是一个宠物博主，我家是个布偶猫，帮我想个这期的选题，要能够体现出我的喵喵很可爱',
  },
];

export const ThreadWelcome: FC<ThreadWelcomeProps> = (
  props: ThreadWelcomeProps
) => {
  const threadRuntime = useThreadRuntime();

  // 卡片点击时，自动发送消息并跳转协作区
  const handleCardClick = (prompt: string) => {
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text: prompt }],
    });
  };

  return (
    <ThreadPrimitive.Empty>
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center w-full pb-14 pt-10">
        <div className="w-full mx-auto flex flex-col items-center">
          {/* 顶部标题区 */}
          <div className="w-full flex flex-col items-center mb-4">
            <a
              className="text-[64px] font-extrabold text-gray-900 mb-6 tracking-tight"
              style={{
                backgroundClip: "text",
                backgroundImage:
                  "linear-gradient(to right, #8B5CF6, #4F6BF2, #D946EF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "800",
                lineHeight: "1",
                letterSpacing: "0.05em",
              }}
            >
              Nova
            </a>
            <div className="text-[20px] text-[#737880] font-normal mb-4 leading-relaxed">
              将你的想法转化为精彩内容 - 从这里开始
            </div>
          </div>

          {/* 输入框区域（放大） */}
          <div className="w-full flex flex-col items-center mb-12">
            <div className="w-full flex flex-row items-center justify-center gap-4 mb-4">
              <div className="flex-1 max-w-[672px]">
                {/* 这里插入输入框，放大样式 */}
                <div className="w-full">
                  {React.isValidElement(props.composer)
                    ? React.cloneElement(props.composer as React.ReactElement, {
                        className: `${(props.composer as any)?.props?.className || ""} h-32 text-3xl px-12 py-10 rounded-3xl shadow-md bg-white border border-gray-200 focus:ring-2 focus:ring-primary-200 transition-all w-full max-w-5xl mx-auto`, // 更大输入框
                      })
                    : props.composer}
                </div>
              </div>
            </div>

            {/* 内容建议卡片区块 */}
            <div className="w-full flex flex-col items-center">
              <div className="flex gap-3">
                {contentSuggestions.map((row, i) => (
                  <React.Fragment key={i}>
                    {row.map((text, j) => (
                      <div
                        key={j}
                        className="flex py-[9px] cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#F2F3F5] px-3 py-2.25 text-sm text-[#5C6773] hover:bg-[#E5E6EC] hover:text-[#2F3640]"
                        style={{ justifyContent: "space-between" }}
                        onClick={() => {
                          handleCardClick(text);
                        }}
                      >
                        <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap text-[#5C6773]">
                          {text}
                        </span>
                        <ArrowUp size={14} className="ml-1 text-[#5C6773]" />
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div
            className="w-full px-4 mt-[40px] flex items-center justify-start transition-all duration-300
          pb-8"
          >
            <div className="font-[Outfit] text-[24px] font-[600] text-[#323232]">
              用Nova创作精彩内容
            </div>
          </div>
          {/* Nova功能卡片区块 */}
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
            {novaContentCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 flex flex-col justify-start min-h-[260px] cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => handleCardClick(card.prompt)}
              >
                <div className="text-xl font-bold text-gray-900 mb-4">
                  {card.title}
                </div>
                <p className="text-gray-600 leading-relaxed text-base flex-1">
                  {card.desc}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={card.avatar} alt={card.userName} />
                    {/* <AvatarFallback>{card.userName.slice(0, 2)}</AvatarFallback> */}
                  </Avatar>
                  {/* 用户信息区域 */}
                  <span className="text-sm text-gray-500 font-medium">
                    {card.userName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
};
