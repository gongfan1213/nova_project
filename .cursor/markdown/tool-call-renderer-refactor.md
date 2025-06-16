# ToolCallRenderer 组件重构文档

## 重构目标
将 ToolCallRenderer 组件中的折叠 (Accordion) 部分抽取成独立的 FCRenderComponent 组件。

## 重构过程

### 1. 创建 FCRenderComponent 组件
- 新建文件：`apps/web/src/components/chat-interface/FCRenderComponent.tsx`
- 抽取了 Accordion 相关的 JSX 代码
- 抽取了 `formatJson` 和 `parseObservation` 工具函数
- 使用 React.FC 类型定义

### 2. 创建共享类型文件
- 新建文件：`apps/web/src/components/chat-interface/types.ts`
- 将 `ToolCallData` 和 `ToolCallGroup` 接口移动到共享文件中
- 避免代码重复

### 3. 重构 ToolCallRenderer 组件
- 移除了原有的 Accordion 相关代码
- 移除了 `formatJson` 和 `parseObservation` 函数
- 导入并使用 FCRenderComponent
- 使用共享类型定义

### 4. 代码格式化规范化
- 移除分号 (semi: false)
- 使用单引号 (singleQuote: true)
- 确保代码符合项目格式化规则

## 文件结构
```
apps/web/src/components/chat-interface/
├── types.ts                     # 共享类型定义
├── ToolCallRenderer.tsx         # 主组件（已重构）
├── FCRenderComponent.tsx        # 新抽取的折叠组件
└── ...
```

## 完成状态
- ✅ 创建 FCRenderComponent 组件
- ✅ 创建共享类型文件
- ✅ 重构 ToolCallRenderer 组件
- ✅ 代码格式化规范化
- ✅ 移除代码重复

## Todo
无待办事项，重构已完成。

## 备注
重构后的代码结构更清晰，组件职责更明确，便于维护和复用。 