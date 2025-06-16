# SSE 流式数据缓冲区修复文档

## 问题描述

在浏览器中查看 SSE 响应时，发现第一条数据被截断：

```
{"event": "ag
{"event":"agent_message","conversation_id":"08faa602-ab8c-484a-b100-23ecaef234c4",...}
```

## 问题原因

这是一个典型的流式数据块边界问题：

1. **TCP 数据包分割**：当数据通过网络传输时，可能被分割成多个 TCP 数据包
2. **ReadableStream 读取**：每次 `reader.read()` 可能只获取到部分数据
3. **JSON 解析失败**：不完整的 JSON 数据导致解析错误

## 解决方案

### 核心思路
添加缓冲区机制来处理被截断的数据块：

1. **缓冲区累积**：将每次读取的数据累积到缓冲区中
2. **行完整性检查**：只处理完整的行，保留不完整的行在缓冲区中
3. **边界处理**：在流结束时处理缓冲区中剩余的数据

### 实现代码

```typescript
// 创建流式响应
const stream = new ReadableStream({
  start(controller) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // 添加缓冲区来处理被截断的数据

    async function pump(): Promise<void> {
      try {
        const { done, value } = await reader!.read()

        if (done) {
          // 处理缓冲区中剩余的数据
          if (buffer.trim()) {
            processBuffer(buffer)
          }
          controller.close()
          return
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk // 将新数据添加到缓冲区

        // 按行分割并处理完整的行
        const lines = buffer.split('\n')
        
        // 保留最后一行（可能不完整）在缓冲区中
        buffer = lines.pop() || ''

        // 处理完整的行
        for (const line of lines) {
          processLine(line)
        }

        return pump()
      } catch (error) {
        console.error('Error in stream pump:', error)
        controller.error(error)
      }
    }

    function processBuffer(remainingBuffer: string) {
      const lines = remainingBuffer.split('\n')
      for (const line of lines) {
        processLine(line)
      }
    }

    function processLine(line: string) {
      const trimmedLine = line.trim()

      if (trimmedLine && trimmedLine.startsWith('data: ')) {
        try {
          const dataStr = trimmedLine.slice(6)

          // 处理特殊情况：data: [DONE]
          if (dataStr === '[DONE]') {
            controller.enqueue(
              new TextEncoder().encode('data: [DONE]\n\n')
            )
            return
          }

          const jsonData: AgentResponse = JSON.parse(dataStr)

          // 转发所有数据，保持原始格式
          const encodedData = new TextEncoder().encode(
            `data: ${JSON.stringify(jsonData)}\n\n`
          )
          controller.enqueue(encodedData)

        } catch (parseError) {
          console.warn('Failed to parse SSE data:', parseError, 'Line:', trimmedLine)
          // 对于无法解析的数据，直接转发
          controller.enqueue(
            new TextEncoder().encode(`${line}\n`)
          )
        }
      } else if (trimmedLine.startsWith('event: ') || trimmedLine.startsWith('id: ')) {
        // 转发其他 SSE 字段
        controller.enqueue(
          new TextEncoder().encode(`${line}\n`)
        )
      }
    }

    pump()
  },

  cancel() {
    // 清理资源
    response.body?.cancel()
  }
})
```

## 关键改进点

### 1. 缓冲区机制
- **before**: 直接处理每个数据块
- **after**: 累积数据到缓冲区，确保行的完整性

### 2. 行处理逻辑
- **before**: `const lines = chunk.split('\n')`
- **after**: `buffer += chunk; const lines = buffer.split('\n'); buffer = lines.pop() || ''`

### 3. 边界处理
- **before**: 无特殊处理
- **after**: 在流结束时处理缓冲区剩余数据

### 4. 代码结构优化
- 提取 `processLine` 和 `processBuffer` 函数
- 更清晰的错误处理逻辑

## 测试验证

修复后应该能够看到：

1. **完整的第一条消息**：不再有截断的 JSON
2. **正确的事件序列**：所有 SSE 事件按顺序处理
3. **无解析错误**：控制台不再出现 JSON 解析失败的警告

## 其他需要修复的文件

这个问题可能也存在于其他 SSE 处理文件中：

- `apps/web/src/app/api/agent/update-highlighted-text/route.ts`
- `apps/web/src/app/api/agent/generate-followup/route.ts`

## TODO

- [ ] 应用相同的修复到其他 SSE 处理文件
- [ ] 添加单元测试验证缓冲区逻辑
- [ ] 考虑提取公共的 SSE 处理工具函数

## 最佳实践

1. **始终使用缓冲区**：处理流式数据时必须考虑数据块边界
2. **行级处理**：基于换行符分割数据是最安全的方法
3. **错误处理**：对于无法解析的数据，记录警告但继续处理
4. **资源清理**：确保在流结束或取消时正确清理资源 