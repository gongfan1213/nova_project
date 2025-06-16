"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Settings } from 'lucide-react'
import { FCRenderComponent } from './FCRenderComponent'
import type { ToolCallData, ToolCallGroup } from './types'

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

        <FCRenderComponent toolGroup={toolGroup} />
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