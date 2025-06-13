# followupContent 为空问题修复

## 问题描述

在 `GraphContext.tsx` 中，`setAgentMessage` 函数中的 `followupContent` 参数每次都是空的，导致消息内容无法正确累积。

## 问题原因

JavaScript 中字符串是**按值传递**的，不是按引用传递。当 `followupContent` 作为参数传入 `setAgentMessage` 函数时：

```typescript
const setAgentMessage = (
  followupContent: string,  // 这是一个值拷贝，不是引用
  // ... 其他参数
) => {
  if(data.answer){
    followupContent += data.answer;  // 只修改了局部副本，不影响原始变量
  }
  // ...
}
```

在函数内部修改 `followupContent += data.answer` 只是修改了函数内部的局部副本，而不会影响到调用者传入的原始变量。

## 解决方案

使用对象引用来传递可变的字符串内容：

### 1. 修改函数签名

```typescript
const setAgentMessage = (
  followupContentRef: { current: string },  // 使用对象引用
  followupMessageId: any,
  finalMessages: any,
  finalFunctionTools: any,
  data: any
) => {
  if(data.answer){
    followupContentRef.current += data.answer;  // 修改对象的属性
  }
  
  // 使用时也要改为 followupContentRef.current
  const followupMessage = new AIMessage({
    id: followupMessageId,
    content: followupContentRef.current,
    // ...
  });
}
```

### 2. 修改调用方式

```typescript
// 在 streamFirstTimeGeneration 函数中
let followupContentRef = { current: "" }  // 改为对象

// 调用时传入对象引用
setAgentMessage(
  followupContentRef,  // 传入对象引用
  followupMessageId,
  finalMessages,
  finalFunctionTools,
  data
);
```

### 3. 在 streamRewriteArtifact 函数中也做同样修改

```typescript
let followupContentRef = { current: "" }  // 改为对象

setAgentMessage(
  followupContentRef,  // 传入对象引用
  followupMessageId,
  finalMessages,
  finalFunctionTools,
  data
);
```

## 修复结果

修复后，`followupContent` 能够正确累积 `data.answer` 的内容，消息内容不再为空。

## 相关概念

- **按值传递 vs 按引用传递**：JavaScript 中原始类型（string, number, boolean）是按值传递，对象类型是按引用传递
- **对象引用**：通过传递对象引用，可以在函数内部修改对象的属性，这些修改会反映到原始对象上

## TODO

- [x] 修复 setAgentMessage 函数签名
- [x] 修复 streamFirstTimeGeneration 中的调用
- [x] 修复 streamRewriteArtifact 中的调用
- [ ] 测试修复后的功能是否正常工作 