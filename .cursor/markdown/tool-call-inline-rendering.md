# 工具调用内联渲染功能实现

## 概述
实现了工具调用卡片根据 `startCall.run_time` 在消息内容中的对应 `<tool_call>` 标签位置进行渲染的功能。

## 实现细节

### 1. 修改 MarkdownText 组件
- 在 `apps/web/src/components/ui/assistant-ui/markdown-text.tsx` 中添加了对 `tool_call` 标签的支持
- 创建了 `ToolCallComponent` 组件来处理 `<tool_call name="xxx" run_time="xxx"></tool_call>` 标签
- 该组件根据 `name` 和 `run_time` 属性匹配对应的工具调用数据并渲染 `ToolCallRenderer`

### 2. 数据匹配逻辑
- 从消息的 `metadata.custom.tool_calls` 中获取包含 `run_time` 的工具调用数据
- 从消息的 `additional_kwargs.tool_calls` 中获取原始的 `ToolCallData` 数据
- 通过工具名称和 `run_time`（允许1000ms误差）进行匹配
- 使用 `groupToolCalls` 函数构建 `ToolCallGroup` 对象

### 3. 移除底部渲染
- 修改 `AssistantMessage` 组件，移除了底部的工具调用渲染逻辑
- 现在工具调用完全通过 markdown 中的 `<tool_call>` 标签进行内联渲染

## 数据流程

1. **工具调用生成阶段** (`GraphContext.tsx`)：
   ```typescript
   // 生成带有 run_time 的工具调用数据
   finalFunctionTools.push({
     ...data,
     name: data.tool,
     args: data.tool_input,
     type: "tool_call",
     run_time: timeStamp,
   });
   
   // 在消息内容中插入 tool_call 标签
   followupContentRef.current += `<tool_call name="${data.tool}" run_time="${timeStamp}"></tool_call>`;
   ```

2. **消息渲染阶段** (`MarkdownText.tsx`)：
   ```typescript
   // 解析 tool_call 标签，提取 name 和 run_time 属性
   tool_call: ({ node: _node, name, run_time, ...props }: any) => (
     <ToolCallComponent
       name={name}
       run_time={run_time}
       {...props}
     />
   )
   ```

3. **工具调用匹配阶段** (`ToolCallComponent`)：
   ```typescript
   // 根据 run_time 和 name 匹配对应的工具调用数据
   const targetToolCall = toolCallsFromMetadata.find((call: any) => {
     if (name && call.name !== name) return false;
     if (run_time) {
       const targetRunTime = parseInt(run_time);
       const callRunTime = call.run_time;
       return Math.abs(callRunTime - targetRunTime) < 1000;
     }
     return true;
   });
   ```

## 文件修改列表

- ✅ `apps/web/src/components/ui/assistant-ui/markdown-text.tsx` - 添加 tool_call 标签支持
- ✅ `apps/web/src/components/chat-interface/messages.tsx` - 移除底部工具调用渲染
- ✅ `apps/web/src/components/chat-interface/ToolCallRenderer.tsx` - 保持原有功能不变

## TODO

- [ ] 测试功能在实际工具调用中的表现
- [ ] 优化匹配算法，确保在多个同名工具调用时能正确匹配
- [ ] 考虑添加错误处理和降级方案

## 注意事项

- 当前实现依赖于 `run_time` 字段的精确匹配（允许1000ms误差）
- 需要确保 `GraphContext` 中生成的时间戳与工具调用数据中的时间戳一致
- 如果找不到匹配的工具调用，组件会返回 `null`，不渲染任何内容 