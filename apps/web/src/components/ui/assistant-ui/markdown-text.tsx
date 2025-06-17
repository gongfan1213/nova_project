"use client";

import {
  CodeHeaderProps,
  MarkdownTextPrimitive,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import { FC, memo, useState, type HTMLAttributes } from "react";
import {
  BrainCircuit,
  CheckIcon,
  ChevronDown,
  CopyIcon,
  Loader2,
} from "lucide-react";
// @ts-ignore
import { visit } from "unist-util-visit";
import { ToolCallRenderer, groupToolCalls } from "@/components/chat-interface/ToolCallRenderer";
import { useMessage } from "@assistant-ui/react";

import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { SyntaxHighlighter } from "@/components/ui/assistant-ui/syntax-highlighter";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";

interface ThinkComponentProps extends HTMLAttributes<HTMLDivElement> {
  "data-unclosed"?: boolean;
}

interface ToolCallComponentProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  run_time?: string;
}

const ThinkComponent = ({
  className,
  "data-unclosed": unclosed,
  children,
  ...props
}: ThinkComponentProps) => {
  const isThinking = unclosed === true;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // When thinking, it is never collapsed
  const showContent = isThinking || !isCollapsed;

  const handleToggleCollapse = () => {
    if (!isThinking) {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div
      className={cn(
        "my-4 rounded-lg border border-zinc-200  dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 py-1",
          !isThinking && "cursor-pointer"
        )}
        onClick={handleToggleCollapse}
      >
        <div className="flex items-center gap-2">
          {isThinking ? (
            <Loader2 className="h-5 w-5 animate-spin " />
          ) : (
            <BrainCircuit className="h-5 w-5 " />
          )}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {isThinking ? "think..." : "think"}
          </span>
        </div>
        {!isThinking && (
          <ChevronDown
            className={cn(
              "h-5 w-5 text-zinc-500 transition-transform",
              !isCollapsed && "rotate-180"
            )}
          />
        )}
      </div>
      {showContent && (
        <div className="prose prose-sm dark:prose-invert max-w-none border-t border-zinc-200 p-4 dark:border-zinc-800">
          {children}
        </div>
      )}
    </div>
  );
};

const rehypeMarkUnclosed = () => {
  return (tree: any, file: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName === "think") {
        if (
          node.position?.start?.offset !== undefined &&
          node.position?.end?.offset !== undefined
        ) {
          const rawContent = file.value.slice(
            node.position.start.offset,
            node.position.end.offset
          );

          if (!rawContent.includes("</think>")) {
            if (!node.properties) {
              node.properties = {};
            }
            node.properties["data-unclosed"] = true;
          }
        }
      }
    });
  };
};


// 修复插件：处理解析器错误地将嵌套的 think、message 和 tool_call 标签提升为完全平铺结构
const rehypeFixNesting = () => {
  return (tree: any) => {
    let hasChanges = true
    
    // 需要平铺的标签类型
    const tagsToFlatten = ['think', 'message', 'novatoolcall']
    
    // 反复处理直到没有更多嵌套
    while (hasChanges) {
      hasChanges = false
      
      visit(tree, 'element', (node, index, parent) => {
        // 处理需要平铺的标签的嵌套
        if (
          tagsToFlatten.includes(node.tagName) &&
          parent &&
          typeof index === 'number'
        ) {
          const elementsToHoist: any[] = []
          
          // 递归地找到所有嵌套的标签元素
          const findNestedElements = (children: any[]): any[] => {
            const nested: any[] = []
            
            children.forEach((child: any) => {
              if (child.type === 'element' && tagsToFlatten.includes(child.tagName)) {
                nested.push(child)
                // 递归查找更深层的嵌套
                if (child.children) {
                  nested.push(...findNestedElements(child.children))
                }
              } else if (child.children) {
                // 在其他元素中也查找嵌套的标签
                nested.push(...findNestedElements(child.children))
              }
            })
            
            return nested
          }

          // 查找所有嵌套的元素
          const nestedElements = findNestedElements(node.children || [])
          
          if (nestedElements.length > 0) {
            elementsToHoist.push(...nestedElements)
            hasChanges = true
            
            // 从原始节点中移除所有嵌套的元素
            const removeNestedElements = (children: any[]): any[] => {
              return children.filter((child: any) => {
                if (child.type === 'element' && tagsToFlatten.includes(child.tagName)) {
                  return false // 移除嵌套的标签
                }
                if (child.children) {
                  child.children = removeNestedElements(child.children)
                }
                // 移除空的文本节点
                if (child.type === 'text' && child.value.trim() === '') {
                  return false
                }
                return true
              })
            }
            
            node.children = removeNestedElements(node.children || [])
            
            // 将所有嵌套的元素插入到父节点中，成为当前节点的兄弟节点
            parent.children.splice(index + 1, 0, ...elementsToHoist)
          }
        }
      })
    }
    
    // 额外的清理：确保标签之间的空白文本节点被正确处理
    visit(tree, 'element', (node, index, parent) => {
      if (
        tagsToFlatten.includes(node.tagName) &&
        parent &&
        typeof index === 'number'
      ) {
        // 清理标签内部的空白文本节点
        if (node.children) {
          node.children = node.children.filter((child: any) => {
            if (child.type === 'text') {
              const trimmed = child.value.trim()
              // 保留有内容的文本节点
              return trimmed.length > 0
            }
            return true
          })
        }
      }
    })
  }
}

const ToolCallComponent = ({ name, run_time, ...props }: ToolCallComponentProps) => {
  const message = useMessage();
  
  // 从消息的 metadata 中获取工具调用数据（这些是通过 run_time 匹配的数据）
  const toolCallsFromMetadata = (message as any).metadata?.custom?.tool_calls || [];
  
  // 根据 run_time 找到对应的工具调用
  const targetToolCall = toolCallsFromMetadata.find((call: any) => {
    // 检查工具名称是否匹配
    if (name && call.name !== name) {
      return false;
    }
    
    // 如果有 run_time，则按照 run_time 匹配
    if (run_time) {
      const targetRunTime = parseInt(run_time);
      const callRunTime = call.run_time;
      
      // 允许一定的时间误差（比如 1000ms）
      return Math.abs(callRunTime - targetRunTime) < 1000;
    }
    
    return true; // 如果没有 run_time，仅通过名称匹配
  });
  
  
  if (!targetToolCall) {
    return null; // 如果找不到对应的工具调用，不渲染任何内容
  }

  if(targetToolCall.observation){
    return null; // 结束的不渲染
  }
  
  // 从 additional_kwargs 中获取原始的 ToolCallData 数据来构建 ToolCallGroup
  const toolCallsData = toolCallsFromMetadata;
  const toolGroups = groupToolCalls(toolCallsData);
  
  // 根据工具名称找到对应的组
  const targetToolGroup = toolGroups.find(group => group.tool === targetToolCall.name);
  
  if (!targetToolGroup) {
    // return <div>fc222222</div>
    return null;
  }
  
  return (
    <ToolCallRenderer
      toolGroup={targetToolGroup}
      className="my-4"
      {...props}
    />
  );
};

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw, rehypeMarkUnclosed, rehypeFixNesting]}
      components={{
        // @ts-ignore
        think: ({
          node: _node,
          className,
          "data-unclosed": unclosed,
          ...props
        }: any) => (
          <ThinkComponent
            className={className}
            data-unclosed={unclosed}
            {...props}
          />
        ),
        // @ts-ignore
        novatoolcall: ({ node: _node, name, run_time, ...props }: any) => (
          <ToolCallComponent
            name={name}
            run_time={run_time}
            {...props}
          />
        ),
        // @ts-ignore
        message: ({ node: _node, className, ...props }) => (
          <div
            className={cn(
              "my-4 p-4 dark:bg-green-950/30 bg-gray-50 rounded-lg",
              "before:content-[''] ",
              className
            )}
            {...props}
          />
        ),
        //
        h1: ({ node: _node, className, ...props }) => (
          <h1
            className={cn(
              "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
              className
            )}
            {...props}
          />
        ),
        h2: ({ node: _node, className, ...props }) => (
          <h2
            className={cn(
              "mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className
            )}
            {...props}
          />
        ),
        h3: ({ node: _node, className, ...props }) => (
          <h3
            className={cn(
              "mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className
            )}
            {...props}
          />
        ),
        h4: ({ node: _node, className, ...props }) => (
          <h4
            className={cn(
              "mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
              className
            )}
            {...props}
          />
        ),
        h5: ({ node: _node, className, ...props }) => (
          <h5
            className={cn(
              "my-4 text-lg font-semibold first:mt-0 last:mb-0",
              className
            )}
            {...props}
          />
        ),
        h6: ({ node: _node, className, ...props }) => (
          <h6
            className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)}
            {...props}
          />
        ),
        p: ({ node: _node, className, ...props }) => (
          <p
            className={cn(
              "mb-5 mt-5 leading-7 first:mt-0 last:mb-0",
              className
            )}
            {...props}
          />
        ),
        a: ({ node: _node, className, ...props }) => (
          <a
            target="_blank"
            className={cn(
              "text-primary font-medium underline underline-offset-4",
              className
            )}
            {...props}
          />
        ),
        blockquote: ({ node: _node, className, ...props }) => (
          <blockquote
            className={cn("border-l-2 pl-6 italic", className)}
            {...props}
          />
        ),
        ul: ({ node: _node, className, ...props }) => (
          <ul
            className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)}
            {...props}
          />
        ),
        ol: ({ node: _node, className, ...props }) => (
          <ol
            className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)}
            {...props}
          />
        ),
        hr: ({ node: _node, className, ...props }) => (
          <hr className={cn("my-5 border-b", className)} {...props} />
        ),
        table: ({ node: _node, className, ...props }) => (
          <table
            className={cn(
              "my-5 w-full border-separate border-spacing-0 overflow-y-auto",
              className
            )}
            {...props}
          />
        ),
        th: ({ node: _node, className, ...props }) => (
          <th
            className={cn(
              "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
              className
            )}
            {...props}
          />
        ),
        td: ({ node: _node, className, ...props }) => (
          <td
            className={cn(
              "border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
              className
            )}
            {...props}
          />
        ),
        tr: ({ node: _node, className, ...props }) => (
          <tr
            className={cn(
              "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
              className
            )}
            {...props}
          />
        ),
        sup: ({ node: _node, className, ...props }) => (
          <sup
            className={cn("[&>a]:text-xs [&>a]:no-underline", className)}
            {...props}
          />
        ),
        pre: ({ node: _node, className, ...props }) => (
          <pre
            className={cn(
              "overflow-x-auto rounded-b-lg bg-black p-4 text-white",
              className
            )}
            {...props}
          />
        ),
        code: function Code({ node: _node, className, ...props }) {
          const isCodeBlock = useIsMarkdownCodeBlock();
          return (
            <code
              className={cn(
                !isCodeBlock && "bg-aui-muted rounded border font-semibold",
                className
              )}
              {...props}
            />
          );
        },
        CodeHeader,
        SyntaxHighlighter,
      }}
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy}>
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};
