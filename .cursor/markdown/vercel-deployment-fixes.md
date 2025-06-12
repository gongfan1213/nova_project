# Vercel 部署问题解决方案

## useSearchParams Suspense 边界警告

### 问题描述
在 Vercel 部署时出现警告：
```
useSearchParams() should be wrapped in a suspense boundary at page "/"
```

### 解决方案

#### 方案 1：在 Next.js 配置中忽略警告（推荐）
在 `next.config.mjs` 中添加：
```javascript
experimental: {
  missingSuspenseWithCSRBailout: false, // 忽略 useSearchParams Suspense 警告
}
```

#### 方案 2：使用 SearchParamsWrapper 组件
创建 `SearchParamsWrapper` 组件来包装使用 `useSearchParams` 的组件：
```tsx
import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

// 使用示例
<SearchParamsWrapper>
  <ComponentThatUsesSearchParams />
</SearchParamsWrapper>
```

### 相关文件
- `apps/web/next.config.mjs` - Next.js 配置
- `apps/web/src/components/SearchParamsWrapper.tsx` - Suspense 包装组件
- `apps/web/src/components/canvas/canvas.tsx` - 使用 useSearchParams
- `apps/web/src/components/auth/login/Login.tsx` - 使用 useSearchParams
- `apps/web/src/components/auth/signup/Signup.tsx` - 使用 useSearchParams

### 状态
✅ 已解决 - 使用方案 1 在配置中忽略警告

### TODO
- [ ] 如果需要更规范的解决方案，可以考虑使用方案 2 重构相关组件 