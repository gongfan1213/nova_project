import { ProgrammingLanguageOptions } from "@opencanvas/shared/types";
import { ThreadPrimitive, useThreadRuntime } from "@assistant-ui/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useMemo } from "react";
import { TighterText } from "../ui/header";
import { NotebookPen } from "lucide-react";
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
    '拆解小水水最新爆款视频的拍摄逻辑和分镜',
    '给我一个"巴厘岛旅行情侣穿搭"主题的小红书vlog脚本',
  ],
  [
    '现在有一款产品是带有白松香和广藿香香调的氨基酸沐浴露，主打"闻起来像高级香水"。请给我一个该产品小红书种草帖子的封面图拍摄建议',
    '如何快速起号？给我一个爆款Vlog拍摄脚本',
  ],
];

// 新内容卡片数据
const novaContentCards = [
  {
    title: '爆款泰国小吃种草文案',
    desc: 'AI生成的泰国小吃种草视频文案，将深挖泰国街头巷尾的地道美味，结合专业美食知识与真实探店体验，精心撰写泰国小吃推荐文案，用生动笔触描绘每一口的独特口感。从夜市街边摊到米其林餐厅，无论是解馋小食还是正餐搭配，都能带你沉浸式感受东南亚风味的独特魅力。',
    prompt: '请模拟美食账号，写一条描述泰国小吃的爆款文案',
  },
  {
    title: '家庭创伤主题的结尾文案',
    desc: '每一段关于原生家庭的倾诉，都是治愈的开始。这里AI将用心理学视角解析成长创伤，融入无数真实故事与个体感悟，用温暖且有力量的文字，带你直面内心深处的隐痛。从自我接纳到情感疗愈，所生成文案的每一个细节都饱含关怀与理解。',
    prompt: '请生成一组"原生家庭痛苦"话题的结尾文案，要有代入感，能引导点赞/收藏',
  },
  {
    title: '找到电影行业热点选题',
    desc: 'AI将深度追踪电影行业最新热点，洞察爆款电影背后的故事逻辑与创作巧思，，打造极具小红书特色的种草内容。每一个选题都精准聚焦热点趋势，让读者仿佛置身电影世界。',
    prompt: '帮我从电影行业热点中挖掘一个符合小红书平台的内容选题并生成五篇文案',
  },
  {
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
      <div className="flex items-center justify-center mt-16 w-screen">
        <div className="text-center max-w-3xl w-full">
          {/* <Avatar className="mx-auto">
            <AvatarImage src="/lc_logo.jpg" alt="LangChain Logo" />
            <AvatarFallback>LC</AvatarFallback>
          </Avatar> */}
          <TighterText className="mt-4 text-5xl font-bold">
            Nova
          </TighterText>
          <div className="mt-8 w-full">
            <QuickStartButtons
              composer={props.composer}
              handleQuickStart={props.handleQuickStart}
              searchEnabled={props.searchEnabled}
            />
            {/* 内容建议卡片区，插入在输入框下方、用Nova创作精彩内容上方 */}
            <TooltipProvider>
              <div className="mb-4 flex flex-col items-center w-full">
                {contentSuggestions.map((row, i) => (
                  <div key={i} className="flex gap-4 mb-2">
                    {row.map((text, j) => (
                      <Tooltip key={j} delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div
                            className="bg-gray-100 rounded-xl px-4 py-2 text-[#454C53] max-w-xs whitespace-nowrap overflow-hidden text-ellipsis text-base flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
                            style={{ minWidth: 0 }}
                          >
                            {text}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs break-words whitespace-pre-line">
                          {text}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
            <TighterText className="mt-16 text-2xl font-bold">
              用Nova创作精彩内容
            </TighterText>
           
          </div>
          {/* 中文卡片区块 */}
          
        </div>
      </div>
       {/* 新内容卡片区块，样式与ChineseFeatureCards一致 */}
       <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 px-4">
              {novaContentCards.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-[20px] shadow-md p-6 cursor-pointer hover:shadow-lg transition"
                  onClick={() => handleCardClick(card.prompt)}
                >
                  <div className="text-lg font-bold text-gray-900 mb-4">{card.title}</div>
                  <p className="text-gray-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
      <ChineseFeatureCards onCardClick={handleCardClick} />
    </ThreadPrimitive.Empty>
  );
};
