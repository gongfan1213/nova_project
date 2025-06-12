# Artifact 内容去重优化

## 问题背景
在保存 artifact 内容时，如果新提交的内容与数据库中最新的一条内容完全相同，会产生重复记录，造成数据冗余和存储浪费。

## 解决方案
在 `/api/thread/[id]/state` API 中添加去重逻辑，比较新内容与现有内容，避免保存重复数据。

## 实现逻辑

### 1. 获取最新现有内容
```typescript
// 获取最新的一条内容（index最大的）用于去重比较
const latestExistingContent = existingContents.length > 0 
  ? existingContents.find((c: any) => c.index === maxExistingIndex)
  : null
```

### 2. 内容去重比较
```typescript
// 过滤出不重复的新内容
const uniqueContents = artifact.contents.filter((newContent: any) => {
  if (!latestExistingContent) {
    return true; // 如果没有现有内容，则所有新内容都是唯一的
  }

  // 比较内容字符串，根据内容类型选择比较字段
  let newContentStr = '';
  let existingContentStr = '';

  if (newContent.type === 'code') {
    newContentStr = newContent.code || '';
    existingContentStr = latestExistingContent.code || '';
  } else if (newContent.type === 'text') {
    newContentStr = newContent.fullMarkdown || '';
    existingContentStr = latestExistingContent.full_markdown || '';
  }

  const isDuplicate = newContentStr.trim() === existingContentStr.trim();
  
  if (isDuplicate) {
    console.log(`Skipping duplicate content (type: ${newContent.type}):`, {
      newContentLength: newContentStr.length,
      existingContentLength: existingContentStr.length,
      title: newContent.title
    });
  }

  return !isDuplicate;
});
```

### 3. 条件性插入
```typescript
if (uniqueContents.length > 0) {
  // 只插入非重复的内容
  // 设置新的 current_index 为最新添加的内容的 index
  newCurrentIndex = nextIndex - 1
} else {
  console.log('All contents are duplicates, skipping insertion')
  // 如果所有内容都是重复的，保持当前 index
  newCurrentIndex = artifact.currentIndex || existingArtifact.current_index
}
```

## 比较策略

### 内容类型处理
- **代码类型 (`type: 'code'`)**: 比较 `code` 字段
- **文本类型 (`type: 'text'`)**: 比较 `fullMarkdown` 字段

### 比较方法
- 使用 `trim()` 去除首尾空白字符
- 进行严格字符串相等比较 (`===`)
- 只与最新的一条内容（index 最大）进行比较

## 优化效果

### 避免的问题
1. **数据冗余**: 不再保存完全相同的内容
2. **存储浪费**: 减少数据库存储空间占用
3. **版本混乱**: 避免无意义的版本递增

### 保持的功能
1. **版本控制**: 真正不同的内容仍会创建新版本
2. **历史记录**: 保留所有有意义的内容变更
3. **当前指针**: 正确维护 `current_index`

## 日志记录

### 调试信息
- 记录最新现有内容的详情
- 记录重复内容的跳过信息
- 记录实际插入的内容数量

### 示例日志
```
Latest existing content (index 3): { type: 'text', full_markdown: '...' }
Skipping duplicate content (type: text): {
  newContentLength: 1234,
  existingContentLength: 1234,
  title: 'Generated Artifact'
}
All contents are duplicates, skipping insertion
```

## 边界情况处理

### 1. 首次创建 Artifact
- 没有现有内容时，所有新内容都被认为是唯一的
- 正常插入所有内容

### 2. 部分重复
- 如果新内容列表中有些重复有些不重复
- 只插入不重复的内容

### 3. 全部重复
- 如果所有新内容都与最新现有内容重复
- 跳过插入，保持当前 index 不变

## 性能考虑

### 优化点
- 只与最新一条内容比较，而不是所有历史内容
- 使用简单的字符串比较，避免复杂的深度比较
- 在过滤阶段就排除重复，减少数据库操作

### 复杂度
- 时间复杂度: O(n)，其中 n 是新内容的数量
- 空间复杂度: O(1)，只需存储最新现有内容的引用

## 注意事项

1. **内容格式一致性**: 确保比较的字段名称正确对应
2. **空值处理**: 使用 `|| ''` 处理可能的 null/undefined 值
3. **大小写敏感**: 当前实现是大小写敏感的比较
4. **空白字符**: 使用 `trim()` 忽略首尾空白差异

## TODO

- [ ] 考虑添加更智能的内容比较（忽略空白行差异等）
- [ ] 监控去重效果，统计减少的重复保存次数
- [ ] 考虑扩展到多级内容比较（不仅仅是最新一条） 