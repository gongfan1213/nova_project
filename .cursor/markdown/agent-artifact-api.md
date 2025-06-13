# Agent Artifact API 使用指南

## 概述

新创建的 `/api/agent/artifact` 路由用于转发 `api.xxx.ai/v1/agent` 接口的流式响应。

## 配置

### 环境变量

在 `.env.local` 文件中添加：

```bash
AGENT_API_KEY=your_agent_api_key_here
```

## API 接口

### 请求

**URL:** `POST /api/agent/artifact`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
  "query": "用户的问题或指令",
  "conversation_id": "可选的对话ID",
  "user_id": "可选的用户ID",
  // 其他参数会直接转发给目标API
}
```

### 响应

流式响应，Content-Type: `text/event-stream`

```
data: {"event": "message", "data": {...}}

data: {"event": "progress", "data": {...}}

data: [DONE]
```

## 前端使用示例

### React Hook

```typescript
import { useState, useCallback, useRef } from 'react'

interface AgentMessage {
  event: string
  data?: any
  [key: string]: any
}

export function useAgentStream() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (
    query: string, 
    options?: {
      conversation_id?: string
      user_id?: string
      [key: string]: any
    }
  ) => {
    setIsLoading(true)
    setError(null)
    setMessages([])

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent/artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...options,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Request failed')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6)
            
            if (dataStr === '[DONE]') {
              setIsLoading(false)
              return
            }

            try {
              const data = JSON.parse(dataStr)
              setMessages(prev => [...prev, data])
            } catch (parseError) {
              console.warn('Failed to parse message:', parseError)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        console.error('Stream error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopStream,
  }
}
```

### React 组件示例

```typescript
import React, { useState } from 'react'
import { useAgentStream } from './hooks/useAgentStream'

export function AgentChat() {
  const [input, setInput] = useState('')
  const { messages, isLoading, error, sendMessage, stopStream } = useAgentStream()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput('')
    
    await sendMessage(query, {
      user_id: 'user-123',
      // 其他选项
    })
  }

  return (
    <div className="agent-chat">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <div className="event-type">{message.event}</div>
            <div className="content">
              {JSON.stringify(message.data, null, 2)}
            </div>
          </div>
        ))}
        
        {error && (
          <div className="error">
            错误: {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入您的问题..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '发送中...' : '发送'}
        </button>
        {isLoading && (
          <button type="button" onClick={stopStream}>
            停止
          </button>
        )}
      </form>
    </div>
  )
}
```

### 简单的 JavaScript 示例

```javascript
async function callAgentAPI(query) {
  try {
    const response = await fetch('/api/agent/artifact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        user_id: 'test-user',
      }),
    })

    if (!response.ok) {
      throw new Error('Request failed')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          
          if (dataStr === '[DONE]') {
            console.log('Stream completed')
            return
          }

          try {
            const data = JSON.parse(dataStr)
            console.log('Received:', data)
            // 处理接收到的数据
          } catch (e) {
            console.warn('Parse error:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

// 使用示例
callAgentAPI('请帮我生成一个待办事项应用')
```

## 特性

1. **完整的流式转发**: 保持原始 SSE 格式
2. **错误处理**: 详细的错误信息和状态码
3. **CORS 支持**: 支持跨域请求
4. **类型安全**: TypeScript 接口定义
5. **资源清理**: 正确处理流的取消和清理
6. **灵活的参数**: 支持任意参数转发

## 注意事项

1. 确保设置正确的 `AGENT_API_KEY` 环境变量
2. 目标 API 地址需要根据实际情况修改
3. 前端需要正确处理流式响应和错误情况
4. 建议添加请求超时和重试机制 