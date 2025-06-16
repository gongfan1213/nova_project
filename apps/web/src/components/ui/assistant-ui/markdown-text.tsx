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

import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { SyntaxHighlighter } from "@/components/ui/assistant-ui/syntax-highlighter";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";

interface ThinkComponentProps extends HTMLAttributes<HTMLDivElement> {
  "data-unclosed"?: boolean;
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


// 修复插件：处理解析器错误地将嵌套的 think 和 message 标签提升为平铺结构
const rehypeFixNesting = () => {
  return (tree: any) => {
    let hasChanges = true
    
    // 反复处理直到没有更多嵌套
    while (hasChanges) {
      hasChanges = false
      
      visit(tree, 'element', (node, index, parent) => {
        // 处理 think 和 message 标签的嵌套
        if (
          (node.tagName === 'think' || node.tagName === 'message') &&
          parent &&
          typeof index === 'number'
        ) {
          const elementsToHoist: any[] = []
          let elementFound = false

          // 过滤出嵌套的 think 和 message 元素并将其从当前节点的子节点中移除
          const newChildren = node.children.filter((child: any) => {
            if (
              child.type === 'element' &&
              (child.tagName === 'think' || child.tagName === 'message')
            ) {
              elementsToHoist.push(child)
              elementFound = true
              hasChanges = true
              return false // 从 children 中移除
            }
            // 如果已经找到了嵌套元素，并且当前节点是空的文本节点（通常是换行符），也一并移除
            if (elementFound && child.type === 'text' && child.value.trim() === '') {
              return false
            }
            return true
          })

          // 如果找到了需要提升的元素
          if (elementsToHoist.length > 0) {
            node.children = newChildren

            // 将嵌套的元素插入到 parent 的子节点中，使其成为当前节点的兄弟节点
            parent.children.splice(index + 1, 0, ...elementsToHoist)
          }
        }
      })
    }
  }
}

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
