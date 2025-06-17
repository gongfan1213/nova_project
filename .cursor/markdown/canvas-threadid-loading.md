# Canvas ThreadId 加载状态处理

## 修改日期
2024-12-27

## 问题描述
当 URL 中有 threadId 参数且正在加载数据时，chatStarted 应该为 true，以便用户能够看到正在加载的状态，而不是显示空白的开始界面。

## 解决方案

### 1. 添加线程加载状态监听
- 在 `CanvasComponent` 中添加了 `threadId` 的依赖，从 `useThreadContext` 获取
- 添加了 `isLoadingThread` 状态来跟踪线程是否正在加载
- 添加了 `useEffect` 来监听 URL 中的 threadId 变化：
  ```typescript
  useEffect(() => {
    if (threadId) {
      setChatStarted(true);
      setIsLoadingThread(true);
    } else {
      setIsLoadingThread(false);
    }
  }, [threadId, setChatStarted]);
  ```

### 2. 加载完成状态更新
- 在两个 `switchSelectedThreadCallback` 回调函数中都添加了 `setIsLoadingThread(false)`
- 确保当线程数据加载完成时，加载状态会被正确更新

### 3. 渲染逻辑优化
- 导入了 `CanvasLoading` 组件用于显示加载状态
- 当 `chatStarted && isLoadingThread` 为 true 时显示加载界面
- 当 `chatStarted && !isLoadingThread` 为 true 时显示正常的聊天界面
- 确保加载状态下不会同时显示多个界面

## 文件修改
- `apps/web/src/components/canvas/canvas.tsx`

## 预期效果
1. 当用户通过 URL 访问带有 threadId 的页面时，立即显示加载状态
2. 数据加载完成后，正确显示聊天界面
3. 用户体验更加流畅，不会看到空白界面

## 问题修复 (2024-12-27 更新)

### 发现的问题
初始实现有一个关键问题：`switchSelectedThreadCallback` 回调函数只在特定 UI 组件中被调用，而不是在实际的线程数据加载过程中被调用。这导致 `isLoadingThread` 状态永远不会被设置为 `false`，用户永远看到加载状态。

### 修复方案
1. **移除了对 UI 回调的依赖**：不再在 `switchSelectedThreadCallback` 中设置 `setIsLoadingThread(false)`
2. **添加了数据状态监听**：通过监听 `messages` 和 `artifact` 的变化来判断线程数据是否加载完成
3. **新增的 useEffect**：
   ```typescript
   useEffect(() => {
     if (threadId && (messages.length > 0 || artifact)) {
       setIsLoadingThread(false);
     }
   }, [threadId, messages.length, artifact]);
   ```

### 修复逻辑
- 当 URL 中有 threadId 时，立即设置 `chatStarted = true` 和 `isLoadingThread = true`
- 当线程数据（messages 或 artifact）加载完成时，自动设置 `isLoadingThread = false`
- 这样确保了加载状态能够正确地从 true 转换为 false

## TODO
- [x] 修复加载状态一直显示的问题
- [ ] 测试不同场景下的加载状态显示
- [ ] 确认加载状态的UI是否符合设计要求
- [ ] 检查是否需要添加错误处理逻辑 