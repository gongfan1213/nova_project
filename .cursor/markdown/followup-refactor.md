# Followup 方法重构文档

## 背景
在 `apps/web/src/contexts/GraphContext.tsx` 文件中，发现有三处几乎相同的 followup 生成代码，造成了代码重复。

## 重复代码位置
1. `streamFirstTimeGeneration` 方法中（约 386-480 行）
2. `streamRewriteArtifact` 方法中（约 615-683 行）  
3. `streamRewriteHighlightedText` 方法中（约 872-940 行）

## 重构方案
提取出一个通用的 `generateFollowup` 方法，包含以下功能：
- 调用 `/api/dify/generate-followup` API
- 处理流式响应
- 更新 UI 状态中的消息
- 可选的更新 finalMessages 数组（用于第一次生成场景）

## 重构后的方法签名
```typescript
const generateFollowup = async (
  artifactContent: string,
  chatHistory: string,
  finalMessages?: BaseMessage[]
) => {
  // ... 实现
}
```

## 调用方式
1. `streamFirstTimeGeneration`: `await generateFollowup(artifactContent, chatHistory, finalMessages)`
2. `streamRewriteArtifact`: `await generateFollowup(artifactContent, chatHistory)`
3. `streamRewriteHighlightedText`: `await generateFollowup(params?.highlightedText?.fullMarkdown || '', chatHistory)`

## 好处
- 消除了代码重复（减少约 200 行重复代码）
- 统一了 followup 生成逻辑
- 便于维护和修改
- 减少了潜在的 bug

## TODO
- [x] 创建通用的 generateFollowup 方法
- [x] 替换第一处 followup 代码
- [x] 替换第二处 followup 代码  
- [x] 替换第三处 followup 代码
- [x] 修复类型错误
- [x] 记录重构过程

## 注意事项
- 保持了原有的功能不变
- 每个调用点的参数略有不同，需要适配
- 类型安全：确保 artifactContent 参数不为 undefined 