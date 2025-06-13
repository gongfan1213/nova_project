# Next.js 流式输出转发指南

## 概述

在 Next.js 中，我们可以使用 ReadableStream API 来实现流式响应的转发。这在需要代理第三方 API 的流式响应时特别有用，比如 AI 聊天接口、实时数据推送等场景。

## 核心概念

### 1. ReadableStream API

ReadableStream 是 Web Streams API 的一部分，允许我们创建和处理流式数据：

```typescript
const stream = new ReadableStream({
  start(controller) {
    // 初始化流
  },
  cancel() {
    // 清理资源
  }
})
```

### 2. Server-Sent Events (SSE)

SSE 是一种服务器向客户端推送数据的技术，通常使用以下格式：

```
data: {"message": "Hello World"}

data: {"message": "Another message"}

```

## 实现步骤

### 步骤 1: 接收并验证请求

```typescript
export async function POST(req: NextRequest) {
  const { query, conversation_id } = await req.json()
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query is required' },
      { status: 400 }
    )
  }
}
```

### 步骤 2: 转发请求到目标 API

```typescript
const response = await fetch(targetUrl, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData),
})
```

### 步骤 3: 创建流式响应处理器

```typescript
const stream = new ReadableStream({
  start(controller) {
    const reader = response.body?.getReader()
    
    if (!reader) {
      controller.error(new Error('No response body reader available'))
      return
    }

    const decoder = new TextDecoder()

    async function pump(): Promise<void> {
      try {
        const { done, value } = await reader!.read()
        
        if (done) {
          controller.close()
          return
        }

        // 处理流式数据
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            // 解析并过滤数据
            const jsonData = JSON.parse(line.slice(6))
            if (jsonData.event === 'message') {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(jsonData)}\n\n`)
              )
            }
          }
        }

        return pump()
      } catch (error) {
        controller.error(error)
      }
    }

    pump()
  },
  
  cancel() {
    response.body?.cancel()
  }
})
```

### 步骤 4: 返回流式响应

```typescript
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  },
})
```

## 最佳实践

### 1. 错误处理

- 在每个异步操作中添加 try-catch
- 为不同类型的错误提供有意义的错误消息
- 确保在出错时正确关闭 stream

### 2. 类型安全

```typescript
interface RequestBody {
  query: string
  conversation_id?: string
}

interface StreamResponse {
  event: string
  conversation_id?: string
  [key: string]: any
}
```

### 3. 资源清理

```typescript
cancel() {
  response.body?.cancel()
}
```

### 4. CORS 设置

如果需要跨域访问，添加适当的 CORS 头：

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

## 前端使用示例

### JavaScript/TypeScript 客户端

```typescript
async function streamChat(query: string, conversationId?: string) {
  const response = await fetch('/api/dify/generate-artifact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      conversation_id: conversationId,
    }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader!.read()
    
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        console.log('Received:', data)
        // 处理接收到的数据
      }
    }
  }
}
```

### React Hook 示例

```typescript
import { useState, useCallback } from 'react'

export function useStreamingChat() {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (query: string, conversationId?: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/dify/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversation_id: conversationId }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            setMessages(prev => [...prev, data])
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { messages, isLoading, sendMessage }
}
```

## 常见问题与解决方案

### 1. 内存泄漏

确保在组件卸载或操作取消时正确清理 reader：

```typescript
useEffect(() => {
  return () => {
    reader?.cancel()
  }
}, [])
```

### 2. 连接中断处理

添加重连逻辑：

```typescript
async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connectToStream()
      break
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 3. 性能优化

- 使用 Web Workers 处理大量数据
- 实现消息队列避免 UI 阻塞
- 合理设置缓冲区大小

## 总结

流式转发在 Next.js 中是一个强大的功能，特别适用于：

- AI 聊天应用
- 实时数据推送
- 大文件处理
- 长时间运行的任务

通过合理的错误处理、类型安全和资源管理，可以构建出稳定可靠的流式 API。 