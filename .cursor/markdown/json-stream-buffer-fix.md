# JSON 流数据缓冲修复

## 问题描述
在处理流式 JSON 数据时，遇到 "Unterminated string in JSON at position 6708" 错误。这是因为网络传输的数据流可能会在任意位置被分割，导致 JSON 对象被截断，无法正确解析。

## 问题原因
1. **数据流分割**: 网络传输中，一个完整的 JSON 对象可能被分割成多个 chunk
2. **直接解析**: 原代码直接对每行进行 JSON.parse()，没有考虑数据可能不完整
3. **字符串截断**: JSON 字符串在某个位置被截断，导致语法错误

## 修复方案

### 实现缓冲机制
为每个流处理函数添加缓冲区，确保只解析完整的数据行：

```typescript
let buffer = ""; // 添加缓冲区来处理不完整的数据

// 在读取数据的循环中：
const chunk = decoder.decode(value, { stream: true });
buffer += chunk; // 将新数据添加到缓冲区

// 按行分割，但保留最后一个可能不完整的行
const lines = buffer.split("\n");
buffer = lines.pop() || ""; // 保存最后一个可能不完整的行

for (const line of lines) {
  if (line.trim() && line.startsWith("data: ")) {
    try {
      const jsonString = line.slice(6).trim();
      if (!jsonString) continue; // 跳过空的数据行
      
      const data = JSON.parse(jsonString);
      // 处理数据...
    } catch (e) {
      // 错误处理...
    }
  }
}
```

### 修复的函数列表
1. `streamFirstTimeGeneration` - 首次生成时的流处理
2. `streamRewriteArtifact` - 重写 artifact 时的流处理
3. `streamRewriteHighlightedText` - 划线编辑时的流处理
4. `generateFollowup` - 生成 followup 消息时的流处理

## 修复原理

### 问题场景
```
原始数据流: data: {"event":"message","answer":"Hello World"}\n
分割情况:   chunk1: data: {"event":"message","ans
           chunk2: wer":"Hello World"}\n
```

### 修复后的处理
```
chunk1 到达: buffer = 'data: {"event":"message","ans'
            lines = ['data: {"event":"message","ans']
            buffer = 'data: {"event":"message","ans' (保留不完整行)

chunk2 到达: buffer = 'data: {"event":"message","answer":"Hello World"}\n'
            lines = ['data: {"event":"message","answer":"Hello World"}', '']
            buffer = '' (最后一行为空)
            处理完整的 JSON: {"event":"message","answer":"Hello World"}
```

## 关键改进点

1. **缓冲区管理**: 使用 `buffer` 变量累积数据，直到获得完整的行
2. **行分割策略**: `lines.pop()` 保留最后一个可能不完整的行
3. **空行过滤**: 跳过空的 JSON 字符串，避免解析错误
4. **trim() 处理**: 移除多余的空白字符

## 预期效果

1. ✅ 完全解决 "Unterminated string" 错误
2. ✅ 确保所有完整的 JSON 数据都能被正确解析
3. ✅ 优雅处理网络分包导致的数据分割
4. ✅ 保持原有的流式处理性能
5. ✅ 提供更好的错误处理和调试信息

## 测试验证

建议进行以下测试：
1. 发送大量数据，观察是否还有 JSON 解析错误
2. 模拟网络波动情况下的数据传输
3. 检查所有功能是否正常工作
4. 验证没有数据丢失或重复处理

## 注意事项

- 缓冲区会在流结束时自动清理
- 该修复不会影响正常的完整数据处理
- 错误日志现在会提供更详细的调试信息
- 保持了向后兼容性 