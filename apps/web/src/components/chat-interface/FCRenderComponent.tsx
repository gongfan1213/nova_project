"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Code, Eye } from "lucide-react";
import type { ToolCallGroup } from "./types";
import { ToolCallRendererXhsSearch } from "./ToolCallRendererXhsSearch";

interface FCRenderComponentProps {
  toolGroup: ToolCallGroup;
}

export const FCRenderComponent: React.FC<FCRenderComponentProps> = ({
  toolGroup,
}) => {
  const { tool, startCall, endCall, isComplete } = toolGroup;

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const parseObservation = (observation: string) => {
    try {
      const parsed = JSON.parse(observation);
      if (parsed[tool]) {
        const toolResult = JSON.parse(parsed[tool]);
        return JSON.stringify(toolResult, null, 2);
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return observation;
    }
  };

  const DefaultFCRender = () => {
    // if (tool === "xhsSearch") {
    //   return <ToolCallRendererXhsSearch />;
    // }
    return (
      <>
        {/* 工具输入 */}
        {startCall.tool_input && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
              <Code className="size-4" />
              输入参数:
            </h4>
            <div className="bg-slate-900 rounded-lg p-3">
              <pre className="text-xs text-green-400 overflow-x-auto">
                {formatJson(startCall.tool_input)}
              </pre>
            </div>
          </div>
        )}

        {/* 工具输出 */}
        {isComplete && endCall?.observation && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-1">
              <Code className="size-4" />
              输出结果:
            </h4>
            <div className="bg-slate-900 rounded-lg p-3">
              <pre className="text-xs text-blue-400 overflow-x-auto">
                {parseObservation(endCall.observation)}
              </pre>
            </div>
          </div>
        )}
      </>
    );
  };
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={`tool-call-${startCall.id}`}
        className="border-none"
      >
        <AccordionTrigger className="hover:no-underline py-2">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="size-4" />
            工具调用详情
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {/* 思考过程 */}
          {/* {startCall.thought && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-700">思考过程:</h4>
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="whitespace-pre-wrap">{startCall.thought}</p>
            </div>
          </div>
        )} */}

          <DefaultFCRender />

          {/* 未完成状态提示 */}
          {!isComplete && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-sm text-orange-700">
                🤔 工具正在执行中，请稍候...
              </p>
            </div>
          )}

          {/* 元数据 */}
          {/* <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">消息ID:</span>
            <p className="font-mono mt-1">{startCall.message_id}</p>
          </div>
          <div>
            <span className="font-medium">任务ID:</span>
            <p className="font-mono mt-1">{startCall.task_id}</p>
          </div>
        </div> */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
