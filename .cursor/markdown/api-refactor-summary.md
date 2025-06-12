# API 重构总结：仿照 api/assistant 接口重写 api/user-bg 接口

## 重构目标
仿照 `api/assistant` 接口的身份验证和结构，重写 `api/user-bg` 接口，提供更安全和一致的 API 设计。

## 主要变更

### 1. 统一身份验证方式
- **之前**: 通过 URL 参数或请求体传递 `userId`，使用 Supabase Service Role Key
- **之后**: 使用 `verifyUserAuthenticated()` 进行身份验证，自动获取当前登录用户

### 2. API 接口变更

#### GET /api/user-bg
- **之前**: `GET /api/user-bg?userId=xxx`
- **之后**: `GET /api/user-bg` (自动关联当前用户)

#### POST /api/user-bg
- **之前**: 请求体需要包含 `userId`
- **之后**: 请求体只需要 `type`, `name`, `description`, `content`

#### PUT /api/user-bg/[id]
- **之前**: 请求体需要包含 `userId`
- **之后**: 请求体只需要 `name`, `description`, `content`

#### DELETE /api/user-bg/[id]
- **之前**: `DELETE /api/user-bg/[id]?userId=xxx`
- **之后**: `DELETE /api/user-bg/[id]` (自动验证用户权限)

### 3. 代码结构改进

#### 路由文件更新
- 导入统一的认证函数：`verifyUserAuthenticated`
- 使用统一的 Supabase 客户端：`createClient` from `@/lib/supabase/server`
- 统一的错误处理和日志格式

#### Hook 层面简化
- 移除所有 API 调用中的 `userId` 参数
- 简化方法签名：
  - `refreshUserBackground()` - 无需传参
  - `addItem(type, item)` - 移除 userId 参数
  - `updateItem(id, updates)` - 移除 userId 参数
  - `deleteItem(id)` - 移除 userId 参数

### 4. 安全性提升
- 所有操作都基于当前登录用户的身份
- 自动验证数据所有权，防止跨用户访问
- 统一的身份验证流程

### 5. 测试页面更新
- 移除硬编码的测试用户 ID
- 更新 API 文档说明
- 简化所有 API 调用代码

## 具体修改文件

### 1. apps/web/src/app/api/user-bg/route.ts
```typescript
// 新增身份验证
const authRes = await verifyUserAuthenticated()
if (!authRes?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// 使用认证用户ID
.eq('user_id', authRes.user.id)
```

### 2. apps/web/src/app/api/user-bg/[id]/route.ts
```typescript
// PUT 和 DELETE 方法都添加了身份验证
// 自动验证记录所有权
if (existingRecord.user_id !== authRes.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

### 3. apps/web/src/hooks/useBgData.tsx
```typescript
// 简化所有方法签名
refreshUserBackground: () => Promise<void>
addItem: (type: BgDataType, item: Omit<BgDataItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
updateItem: (id: string, updates: Partial<Pick<BgDataItem, 'name' | 'description' | 'content'>>) => Promise<boolean>
deleteItem: (id: string) => Promise<boolean>
```

### 4. apps/web/src/app/test-user-bg/page.tsx
```typescript
// 移除所有 userId 参数传递
await refreshUserBackground()
await addItem(newItemForm.type, { ... })
await updateItem(editingItem.id, { ... })
await deleteItem(item.id)
```

## 优势总结

### 1. 安全性
- 基于会话的身份验证，防止用户ID伪造
- 自动权限验证，防止跨用户数据访问
- 统一的认证流程

### 2. 一致性
- 与其他 API 接口（如 assistant）保持一致的设计模式
- 统一的错误处理和响应格式
- 标准化的 Supabase 客户端使用

### 3. 简化性
- 客户端代码更简洁，无需管理用户ID
- 减少了参数传递的复杂性
- 降低了 API 使用的错误率

### 4. 可维护性
- 集中的身份验证逻辑
- 统一的代码结构和模式
- 更好的错误追踪和调试

## 测试验证
- 所有 CRUD 操作正常工作
- 身份验证有效阻止未授权访问
- 用户数据隔离正确实现
- 测试页面功能完整

## TODO
- [ ] 添加 API 速率限制
- [ ] 添加更详细的日志记录
- [ ] 考虑添加批量操作接口
- [ ] 添加数据导入/导出功能

## 结论
重构成功完成，新的 API 设计更加安全、一致和易用。所有功能保持完整的同时，显著提升了代码质量和安全性。 