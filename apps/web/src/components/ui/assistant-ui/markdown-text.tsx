"use client";

import {
  CodeHeaderProps,
  MarkdownTextPrimitive,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { FC, memo, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { visit } from "unist-util-visit";
import rehypeRaw from "rehype-raw";

import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { SyntaxHighlighter } from "@/components/ui/assistant-ui/syntax-highlighter";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css"

// Message 组件
const MessageComponent: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="message-tag my-2 p-3 bg-green-50 rounded-r-lg">
      {children}
    </div>
  );
}

// Think 组件
const ThinkComponent: FC<{ children: React.ReactNode }> = ({ children }) => {
  // 处理文本内容，保留换行符
  const formatContent = (content: React.ReactNode) => {
    if (typeof content === 'string') {
      return content.split('\n').map((line, index, array) => (
        <span key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </span>
      ))
    }
    return content
  }

  return (
    <div className="think-tag my-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-full h-full text-blue-500"
          >
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
            <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
            <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
            <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1" />
          </svg>
        </div>
        <div className="flex-1 text-blue-800 italic text-sm leading-relaxed">
          {formatContent(children)}
        </div>
      </div>
    </div>
  )
};

// 自定义 rehype 插件：将 think 标签转换为 think-component
const rehypeThink = () => {
  return (tree: any) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'think') {
        if (parent && typeof index === 'number') {
          parent.children[index] = {
            type: 'element',
            tagName: 'think-component',
            properties: node.properties, // 传递属性
            children: node.children, // 传递子节点
          }
        }
      }
      // 
      if (node.tagName === 'message') {
        if (parent && typeof index === 'number') {
          parent.children[index] = {
            type: "element",
            tagName: "message-component",
            properties: node.properties, // 传递属性
            children: node.children, // 传递子节点
          };
        }
      }
    })
  }
}

// 修复插件：处理解析器错误地将 message 嵌套在 think 内部的问题
const rehypeFixNesting = () => {
  return (tree: any) => {
    visit(tree, 'element', (node, index, parent) => {
      // 查找 think-component
      if (
        node.tagName === 'think-component' &&
        parent &&
        typeof index === 'number'
      ) {
        const messagesToHoist: any[] = []
        let messageFound = false

        // 过滤出 message-component 并将其从 think-component 的子节点中移除
        const newChildren = node.children.filter((child: any) => {
          if (
            child.type === 'element' &&
            child.tagName === 'message-component'
          ) {
            messagesToHoist.push(child)
            messageFound = true
            return false // 从 children 中移除
          }
          // 如果已经找到了 message，并且当前节点是空的文本节点（通常是换行符），也一并移除
          if (messageFound && child.type === 'text' && child.value.trim() === '') {
            return false
          }
          return true
        })

        // 如果找到了需要提升的 message-component
        if (messagesToHoist.length > 0) {
          node.children = newChildren

          // 将 message-component 插入到 parent 的子节点中，使其成为 think-component 的兄弟节点
          parent.children.splice(index + 1, 0, ...messagesToHoist)
        }
      }
    })
  }
}

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw, rehypeThink, rehypeFixNesting]}
      remarkRehypeOptions={{
        allowDangerousHtml: true
      }}
      components={{
        // @ts-ignore - 自定义组件类型
        'message-component': MessageComponent,
        // @ts-ignore - 自定义组件类型
        'think-component': ThinkComponent,
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
