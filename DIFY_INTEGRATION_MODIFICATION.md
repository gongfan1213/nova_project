# Dify接口集成修改文档

## 修改概述

本次修改将Nova项目中第一种交互模式（首次生成新artifact）的逻辑从原来的LangGraph调用改为调用Dify API接口，并新增了重写artifact的功能。

## 修改的交互模式

### 第一种交互模式：首次生成新artifact

**触发条件**: 
- 当前没有工件存在 (`!artifact`)
- 用户输入了新的消息 (`params.messages && params.messages.length > 0`)

**原始逻辑**:
1. 调用 `generateArtifact` 方法生成artifact内容
2. 调用 `generateFollowup` 方法生成聊天窗口的后续内容

**新逻辑**:
1. 调用Dify API生成artifact内容
2. 调用Dify API生成聊天窗口的后续内容

### 新增交互模式：重写artifact

**触发条件**: 
- 已存在artifact (`artifact`)
- 用户输入了新的消息 (`params.messages && params.messages.length > 0`)
- 存在会话ID (`conversationId`)

**实现逻辑**:
1. 调用Dify API重写artifact内容（传入conversation_id保持同一轮对话）
2. 调用Dify API生成聊天窗口的后续内容
3. artifact内容会被覆盖，聊天消息会追加（不覆盖）

## 新增的API接口

### 1. `/api/dify/generate-artifact`

**位置**: `open-canvas/apps/web/src/app/api/dify/generate-artifact/route.ts`

**功能**: 替换原来的generateArtifact方法

**输入参数**:
- `query` (string): 用户在前端输入的消息内容

**调用的Dify接口**:
```javascript
URL: 'https://api.dify.ai/v1/chat-messages'
Headers: {
  'Authorization': 'Bearer app-OO49SYLKS9blEdwzxCLc7RvU',
  'Content-Type': 'application/json'
}
Body: {
  "inputs": {},
  "query": query,  // 用户输入的消息
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "abc-123"
}
```

**输出格式**: 
- 流式返回，格式为Server-Sent Events (SSE)
- 每个chunk格式: `data: {"event": "message", "answer": "内容片段", ...}`
- 只保留 `event === 'message'` 的记录

**数据流向**: 
- 输入：从前端GraphContext获取用户最后一条消息内容
- 输出：实时更新到artifact显示区域

### 2. `/api/dify/generate-followup`

**位置**: `open-canvas/apps/web/src/app/api/dify/generate-followup/route.ts`

**功能**: 替换原来的generateFollowup方法

**输入参数**:
- `artifact` (string): 当前artifact中对应的内容
- `query` (string): 用户聊天的历史记录

**调用的Dify接口**:
```javascript
URL: 'https://api.dify.ai/v1/chat-messages'
Headers: {
  'Authorization': 'Bearer app-6YxXjVYYXyet7C4guK2BCX28',
  'Content-Type': 'application/json'
}
Body: {
  "inputs": {
    "artifact": artifact  // 当前artifact内容
  },
  "query": query,  // 聊天历史记录
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "abc-123"
}
```

**输出格式**: 
- 流式返回，格式为Server-Sent Events (SSE)
- 每个chunk格式: `data: {"event": "message", "answer": "内容片段", ...}`
- 只保留 `event === 'message'` 的记录

**数据流向**: 
- 输入：从第一步生成的artifact内容和聊天历史
- 输出：实时更新到聊天窗口

## 前端修改详情

### 修改文件
`open-canvas/apps/web/src/contexts/GraphContext.tsx`

### 新增函数

#### `streamFirstTimeGeneration(params: GraphInput)`

**功能**: 处理第一种交互模式的完整流程

**执行步骤**:
1. **准备数据**:
   - 提取用户最后一条消息作为query
   - 设置流式状态

2. **第一阶段 - 生成Artifact**:
   - 调用 `/api/dify/generate-artifact` 接口
   - 实时解析流式响应
   - 逐步更新artifact内容到右侧显示区域
   - 创建ArtifactV3对象结构

3. **第二阶段 - 生成Followup**:
   - 使用生成的artifact内容和聊天历史
   - 调用 `/api/dify/generate-followup` 接口
   - 实时解析流式响应
   - 逐步更新聊天消息到左侧聊天窗口

### 修改的函数

#### `streamMessageV2(params: GraphInput)`

**修改内容**: 在函数开始添加条件判断
```typescript
// 判断是否为第一次生成新artifact的情况
if (!artifact && params.messages && params.messages.length > 0) {
  // 第一种交互模式：第一次生成新artifact
  return streamFirstTimeGeneration(params);
}
```

**判断逻辑**:
- `!artifact`: 当前没有artifact存在
- `params.messages && params.messages.length > 0`: 有用户消息输入

## 数据获取来源

### 输入数据来源

1. **用户消息内容** (`query`):
   - 来源: `params.messages[params.messages.length - 1]?.content`
   - 获取用户在前端输入框中输入的最新消息

2. **Artifact内容** (`artifact`):
   - 来源: 第一步Dify API返回的累积内容
   - 用于传递给第二步的followup生成

3. **聊天历史** (`query` for followup):
   - 来源: `params.messages.map(msg => ${msg.constructor.name}: ${msg.content}).join('\n')`
   - 格式化的完整对话历史

### 输出数据去向

1. **Artifact内容**:
   - 去向: 右侧artifact显示区域
   - 通过 `setArtifact(newArtifact)` 更新
   - 实时流式更新显示

2. **Followup消息**:
   - 去向: 左侧聊天窗口
   - 通过 `setMessages()` 更新消息列表
   - 实时流式更新显示

## 技术实现细节

### 流式处理
- 使用 `fetch` API 获取流式响应
- 使用 `ReadableStream` 和 `TextDecoder` 解析数据
- 实时更新UI状态，提供良好的用户体验

### 错误处理
- API调用失败时显示toast错误提示
- 解析错误时忽略无效数据块
- 设置适当的loading和error状态

### 类型安全
- 添加了适当的TypeScript类型检查
- 处理可能为undefined的参数
- 确保代码的健壮性

## 保持不变的部分

- 其他三种交互模式的逻辑保持不变
- 原有的LangGraph集成继续用于其他交互模式
- UI组件和状态管理结构保持不变
- 错误处理和用户体验保持一致