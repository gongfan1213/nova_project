# 线程API调用优化

## 问题描述
在输入文字发送chat时，频繁调用 `/api/thread/[id]` API，导致不必要的网络请求和性能问题。

## 问题分析
通过分析 `apps/web/src/contexts/GraphContext.tsx` 代码，发现以下问题：

1. **频繁的 artifact 保存**：第187-210行的 useEffect 监听 `artifact` 变化，每次都会触发防抖的API更新
2. **线程状态检查**：第213-236行的 useEffect 监听线程ID变化，会频繁调用 `threadData.getThread`
3. **不必要的线程信息获取**：在 `streamMessageV2` 函数中，每次都获取线程信息检查 conversation_id

## 优化方案

### 1. 优化 artifact 保存逻辑
- 增加更严格的条件判断，避免在流式传输或线程切换时保存
- 使用 JSON.stringify 进行深度比较，确保只在内容真正变化时才保存
- 移除对 messages 长度的依赖，因为 artifact 可以独立存在

### 2. 减少不必要的线程信息获取
- 只在特定条件下才获取线程信息（有artifact且没有highlightedText时）
- 避免在每次消息发送时都检查线程状态

### 3. 清理未使用的代码
- 移除未使用的导入和函数
- 清理 linter 错误

## 具体修改

### GraphContext.tsx 文件修改

1. **移除未使用的导入**：
   - isArtifactCodeContent
   - ArtifactType
   - ProgrammingLanguageOptions
   - RewriteArtifactMetaToolResponse
   - SearchResult
   - DEFAULT_INPUTS
   - OC_WEB_SEARCH_RESULTS_MESSAGE_KEY
   - NON_STREAMING_TEXT_MODELS
   - NON_STREAMING_TOOL_CALLING_MODELS
   - extractChunkFields
   - handleGenerateArtifactToolCallChunk
   - removeCodeBlockFormatting
   - replaceOrInsertMessageChunk
   - updateHighlightedCode
   - updateRewrittenArtifact
   - handleRewriteArtifactThinkingModel
   - isThinkingModel
   - StreamWorkerService
   - useRuns

2. **优化 artifact 保存逻辑**：
   ```typescript
   useEffect(() => {
     // 更严格的条件判断
     if (!threadData.threadId || isStreaming || threadSwitched) return;
     if (!artifact) return;
     if (updateRenderedArtifactRequired) return;
     
     // 深度比较内容变化
     if (
       !lastSavedArtifact.current ||
       JSON.stringify(lastSavedArtifact.current.contents) !== JSON.stringify(artifact.contents)
     ) {
       setIsArtifactSaved(false);
       debouncedAPIUpdate(artifact, threadData.threadId);
     }
   }, [artifact, threadData.threadId, isStreaming, threadSwitched, updateRenderedArtifactRequired]);
   ```

3. **优化线程信息获取**：
   ```typescript
   // 只有在有artifact且没有highlightedText时才需要检查conversation_id
   if (currentThreadId && artifact && !params.highlightedText && params.messages && params.messages.length > 0) {
     try {
       const currentThread = await threadData.getThread(currentThreadId);
       conversationId = currentThread?.metadata?.conversation_id;
       hasConversationId = !!conversationId;
     } catch (error) {
       console.warn('Failed to get current thread metadata:', error);
     }
   }
   ```

## 预期效果

1. **减少API调用频率**：在正常聊天过程中，大幅减少对 `/api/thread/[id]` 的调用
2. **提升响应速度**：减少不必要的网络请求，提升用户体验
3. **优化资源使用**：降低服务器负载和客户端资源消耗

## 注意事项

- 保持防抖机制，确保在快速操作时不会丢失数据
- 维持原有的线程切换和状态管理逻辑
- 确保所有的交互模式（首次生成、重写artifact、划线编辑）仍正常工作

## TODO

- [ ] 监控优化后的API调用频率
- [ ] 确认所有功能正常工作
- [ ] 考虑进一步优化其他可能的频繁调用点 