"use client"

import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Code, Settings, Eye } from 'lucide-react'

interface ToolCallData {
  event: string
  conversation_id: string
  message_id: string
  created_at: number
  task_id: string
  id: string
  position: number
  thought: string
  observation: string
  tool: string
  tool_labels: Record<string, Record<string, string>>
  tool_input: string
  message_files: any[]
}

interface ToolCallGroup {
  tool: string
  tool_labels: Record<string, Record<string, string>>
  startCall: ToolCallData
  endCall?: ToolCallData
  isComplete: boolean
}

interface ToolCallRendererProps {
  toolGroup: ToolCallGroup
  className?: string
}

export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolGroup,
  className = "",
}) => {
  const { tool, startCall, endCall, isComplete } = toolGroup

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }

  const parseObservation = (observation: string) => {
    try {
      const parsed = JSON.parse(observation)
      if (parsed[tool]) {
        const toolResult = JSON.parse(parsed[tool])
        return JSON.stringify(toolResult, null, 2)
      }
      return JSON.stringify(parsed, null, 2)
    } catch {
      return observation
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className={`size-4 ${isComplete ? 'text-green-600' : 'text-orange-500'}`} />
          <Badge variant="outline" className="text-xs">
            {tool}
          </Badge>
          {isComplete ? (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              完成
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              思考中...
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            {formatTimestamp(startCall.created_at)}
          </span>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={`tool-call-${startCall.id}`} className="border-none">
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="size-4" />
                工具调用详情
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* 思考过程 */}
              {startCall.thought && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700">思考过程:</h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="whitespace-pre-wrap">{startCall.thought}</p>
                  </div>
                </div>
              )}

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

              {/* 未完成状态提示 */}
              {!isComplete && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-sm text-orange-700">🤔 工具正在执行中，请稍候...</p>
                </div>
              )}

              {/* 元数据 */}
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">消息ID:</span>
                  <p className="font-mono mt-1">{startCall.message_id}</p>
                </div>
                <div>
                  <span className="font-medium">任务ID:</span>
                  <p className="font-mono mt-1">{startCall.task_id}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

// 辅助函数：将工具调用分组
export const groupToolCalls = (toolCalls: ToolCallData[]): ToolCallGroup[] => {
  const groups: ToolCallGroup[] = []
  
  for (let i = 0; i < toolCalls.length; i++) {
    const currentCall = toolCalls[i]
    
    // 跳过空的工具调用
    if (!currentCall.tool || currentCall.event !== 'agent_thought') continue
    
    // 查找下一个同名工具的调用
    let nextCall: ToolCallData | undefined
    for (let j = i + 1; j < toolCalls.length; j++) {
      const candidate = toolCalls[j]
      if (candidate.tool === currentCall.tool && candidate.event === 'agent_thought') {
        // 如果这个调用有observation，说明是结束调用
        if (candidate.observation) {
          nextCall = candidate
          i = j // 跳过已处理的调用
          break
        }
      } else if (candidate.tool && candidate.tool !== currentCall.tool) {
        // 遇到不同的工具，停止查找
        break
      }
    }
    
    // 创建分组
    groups.push({
      tool: currentCall.tool,
      tool_labels: currentCall.tool_labels,
      startCall: currentCall,
      endCall: nextCall,
      isComplete: !!nextCall?.observation
    })
  }
  
  return groups
} 