export interface ToolCallData {
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

export interface ToolCallGroup {
  tool: string
  tool_labels: Record<string, Record<string, string>>
  startCall: ToolCallData
  endCall?: ToolCallData
  isComplete: boolean
} 